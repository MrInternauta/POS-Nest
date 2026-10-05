import { BadGatewayException, Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import { createHmac, randomUUID, timingSafeEqual } from 'crypto';

import { config } from '../../config';

const MP_API = 'https://api.mercadopago.com';

/** The statuses an Orders API order goes through; anything else is treated as still in progress */
export type MpOrderStatus =
  | 'created'
  | 'at_terminal'
  | 'action_required'
  | 'processed'
  | 'canceled'
  | 'expired'
  | 'failed'
  | 'refunded';

export interface MpOrder {
  id: string;
  status: MpOrderStatus | string;
  status_detail?: string;
  external_reference?: string;
}

export interface MpTerminal {
  id: string;
  pos_id?: number;
  store_id?: string;
  external_pos_id?: string;
  operating_mode?: string;
}

/**
 * The few Mercado Pago calls the Point checkout needs. The access token lives only here, in the
 * backend; the app never sees it. The official SDK only wraps the older payment-intents API for
 * Point, so this talks to the Orders and Terminals APIs directly.
 */
@Injectable()
export class MercadoPagoClient {
  private readonly logger = new Logger(MercadoPagoClient.name);

  constructor(@Inject(config.KEY) private configService: ConfigType<typeof config>) {}

  get isConfigured() {
    return !!this.configService.mercado_pago.access_token;
  }

  /** Sends the charge to the terminal, with the sale id as the external reference */
  createPointOrder(saleId: number, amount: number, terminalId: string, description: string) {
    return this.request<MpOrder>('POST', '/v1/orders', {
      idempotencyKey: randomUUID(),
      body: {
        type: 'point',
        external_reference: `sale-${saleId}`,
        //The sale holds its stock while it waits, so an abandoned charge must not wait forever
        expiration_time: 'PT10M',
        description: description.slice(0, 150),
        transactions: { payments: [{ amount: amount.toFixed(2) }] },
        config: { point: { terminal_id: terminalId, print_on_terminal: 'no_ticket' } },
      },
    });
  }

  getOrder(mpOrderId: string) {
    return this.request<MpOrder>('GET', `/v1/orders/${encodeURIComponent(mpOrderId)}`);
  }

  cancelOrder(mpOrderId: string) {
    return this.request<MpOrder>('POST', `/v1/orders/${encodeURIComponent(mpOrderId)}/cancel`, {
      idempotencyKey: randomUUID(),
    });
  }

  async listTerminals() {
    const response = await this.request<{ data?: { terminals?: MpTerminal[] } }>('GET', '/terminals/v1/list');
    return response?.data?.terminals ?? [];
  }

  /** A terminal only takes charges from an integration while it is in PDV mode */
  setPdvMode(terminalId: string) {
    return this.request('PATCH', '/terminals/v1/setup', {
      body: { terminals: [{ id: terminalId, operating_mode: 'PDV' }] },
    });
  }

  /**
   * Checks the `x-signature` header of a webhook against the secret from the Mercado Pago panel.
   * The signed text is `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`, leaving out the parts
   * that were not sent. Mercado Pago's docs ask for the id in lowercase while its SDK signs it as
   * received, so either form is accepted; both need the secret to produce.
   */
  isValidWebhookSignature(signature: string | undefined, requestId: string | undefined, dataId: string | undefined) {
    const secret = this.configService.mercado_pago.webhook_secret;
    if (!secret || !signature) {
      return false;
    }

    const parts = Object.fromEntries(
      signature.split(',').map(part => part.split('=').map(value => value.trim()) as [string, string])
    );
    const { ts, v1 } = parts;
    if (!ts || !v1) {
      return false;
    }

    const ids = dataId ? [...new Set([dataId, dataId.toLowerCase()])] : [undefined];
    return ids.some(id => {
      const manifest = [id && `id:${id}`, requestId && `request-id:${requestId}`, `ts:${ts}`].filter(Boolean).join(';');
      const expected = createHmac('sha256', secret).update(`${manifest};`).digest('hex');
      return expected.length === v1.length && timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
    });
  }

  private async request<T>(
    method: string,
    path: string,
    { body, idempotencyKey }: { body?: unknown; idempotencyKey?: string } = {}
  ): Promise<T> {
    const token = this.configService.mercado_pago.access_token;
    if (!token) {
      throw new ServiceUnavailableException('Mercado Pago is not configured');
    }

    const response = await fetch(`${MP_API}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await response.text();
    const json = text ? safeJson(text) : null;

    if (!response.ok) {
      //The body names the problem (a terminal already busy, a wrong terminal id), never the token
      this.logger.warn(`Mercado Pago ${method} ${path} answered ${response.status}: ${text.slice(0, 500)}`);
      throw new BadGatewayException({
        message: 'Mercado Pago refused the request',
        mpStatus: response.status,
        mpError: json?.errors?.[0]?.code ?? json?.error ?? json?.message,
      });
    }
    return json as T;
  }
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
