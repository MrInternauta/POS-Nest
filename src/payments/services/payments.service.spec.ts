import { createHmac } from 'crypto';

import { PaymentMethod, PaymentStatus } from '../../orders/entities/order.entity';
import { MercadoPagoClient } from './mercado-pago.client';
import { PaymentsService } from './payments.service';

const SECRET = 'webhook-secret';
const sign = (manifest: string) => createHmac('sha256', SECRET).update(manifest).digest('hex');

const clientWith = (mercado_pago: { access_token?: string; webhook_secret?: string }) =>
  new MercadoPagoClient({ mercado_pago } as never);

describe('MercadoPagoClient.isValidWebhookSignature', () => {
  const client = clientWith({ access_token: 'token', webhook_secret: SECRET });

  it('accepts the signature Mercado Pago builds from the id, request id and timestamp', () => {
    const v1 = sign('id:ORD01ABC;request-id:req-1;ts:1742505638;');
    expect(client.isValidWebhookSignature(`ts=1742505638,v1=${v1}`, 'req-1', 'ORD01ABC')).toBe(true);
  });

  it('accepts the id signed in lowercase, as the docs ask for alphanumeric ids', () => {
    const v1 = sign('id:ord01abc;request-id:req-1;ts:1742505638;');
    expect(client.isValidWebhookSignature(`ts=1742505638,v1=${v1}`, 'req-1', 'ORD01ABC')).toBe(true);
  });

  it('refuses a signature made for another order', () => {
    const v1 = sign('id:ORD-OTHER;request-id:req-1;ts:1742505638;');
    expect(client.isValidWebhookSignature(`ts=1742505638,v1=${v1}`, 'req-1', 'ORD01ABC')).toBe(false);
  });

  it('refuses a missing or malformed header, and everything when no secret is set', () => {
    const v1 = sign('id:ORD01ABC;request-id:req-1;ts:1742505638;');
    expect(client.isValidWebhookSignature(undefined, 'req-1', 'ORD01ABC')).toBe(false);
    expect(client.isValidWebhookSignature(`v1=${v1}`, 'req-1', 'ORD01ABC')).toBe(false);
    expect(
      clientWith({ access_token: 'token' }).isValidWebhookSignature(`ts=1742505638,v1=${v1}`, 'req-1', 'ORD01ABC')
    ).toBe(false);
  });
});

/** An in-memory sale with two units of product 7, and the services around it */
function setup(initialStatus = PaymentStatus.PENDING) {
  const sale = {
    id: 1,
    paymentMethod: PaymentMethod.MP_POINT,
    paymentStatus: initialStatus,
    mpOrderId: 'ORD1',
    user: { id: 10 },
    items: [{ quantity: 2, product: { id: 7, name: 'Coffee' } }],
    total: 50,
  };

  const orderRepo = {
    findOneBy: jest.fn(async (where: { id?: number; mpOrderId?: string }) =>
      where.id === sale.id || where.mpOrderId === sale.mpOrderId ? { ...sale } : null
    ),
    findOne: jest.fn(async () => ({ ...sale })),
    //Matches only while the sale is still in the status asked for, like the SQL WHERE does
    update: jest.fn(async (where: { paymentStatus?: PaymentStatus }, changes: Partial<typeof sale>) => {
      if (where.paymentStatus && where.paymentStatus !== sale.paymentStatus) {
        return { affected: 0 };
      }
      Object.assign(sale, changes);
      return { affected: 1 };
    }),
  };
  const productsService = { addStock: jest.fn() };
  const orderService = { findOne: jest.fn(async () => ({ ...sale })) };
  const mercadoPago = {
    isConfigured: true,
    isValidWebhookSignature: jest.fn(() => true),
    getOrder: jest.fn(),
    cancelOrder: jest.fn(),
  };

  const service = new PaymentsService(
    {} as never,
    orderRepo as never,
    orderService as never,
    productsService as never,
    mercadoPago as never
  );
  return { service, sale, productsService, mercadoPago };
}

const cashier = { sub: 10, role: 'cashier' };

describe('PaymentsService', () => {
  it('marks the sale paid when Mercado Pago says processed, and keeps the stock out', async () => {
    const { service, sale, productsService, mercadoPago } = setup();
    mercadoPago.getOrder.mockResolvedValue({ id: 'ORD1', status: 'processed' });

    await service.handleWebhook('sig', 'req', 'ORD1', 'order');

    expect(sale.paymentStatus).toBe(PaymentStatus.PAID);
    expect(productsService.addStock).not.toHaveBeenCalled();
  });

  it('puts the stock back once when the payment fails, however many times it is told', async () => {
    const { service, sale, productsService, mercadoPago } = setup();
    mercadoPago.getOrder.mockResolvedValue({ id: 'ORD1', status: 'failed' });

    await service.handleWebhook('sig', 'req', 'ORD1', 'order');
    await service.handleWebhook('sig', 'req', 'ORD1', 'order');
    await service.status(cashier, 1);

    expect(sale.paymentStatus).toBe(PaymentStatus.FAILED);
    expect(productsService.addStock).toHaveBeenCalledTimes(1);
    expect(productsService.addStock).toHaveBeenCalledWith(7, 2);
  });

  it('leaves the sale pending while the customer is still at the terminal', async () => {
    const { service, mercadoPago } = setup();
    mercadoPago.getOrder.mockResolvedValue({ id: 'ORD1', status: 'at_terminal' });

    expect((await service.status(cashier, 1)).paymentStatus).toBe(PaymentStatus.PENDING);
  });

  it('ignores a webhook whose signature does not check out', async () => {
    const { service, sale, mercadoPago } = setup();
    mercadoPago.isValidWebhookSignature.mockReturnValue(false);

    expect(await service.handleWebhook('bad', 'req', 'ORD1', 'order')).toBe(false);
    expect(mercadoPago.getOrder).not.toHaveBeenCalled();
    expect(sale.paymentStatus).toBe(PaymentStatus.PENDING);
  });

  it('cancels a pending charge and puts the stock back', async () => {
    const { service, sale, productsService, mercadoPago } = setup();
    mercadoPago.cancelOrder.mockResolvedValue({ id: 'ORD1', status: 'canceled' });

    expect((await service.cancel(cashier, 1)).paymentStatus).toBe(PaymentStatus.CANCELED);
    expect(sale.paymentStatus).toBe(PaymentStatus.CANCELED);
    expect(productsService.addStock).toHaveBeenCalledTimes(1);
  });

  it('keeps the sale paid when the customer paid before the cancel reached Mercado Pago', async () => {
    const { service, sale, productsService, mercadoPago } = setup();
    mercadoPago.cancelOrder.mockRejectedValue(new Error('order already processed'));
    mercadoPago.getOrder.mockResolvedValue({ id: 'ORD1', status: 'processed' });

    expect((await service.cancel(cashier, 1)).paymentStatus).toBe(PaymentStatus.PAID);
    expect(sale.paymentStatus).toBe(PaymentStatus.PAID);
    expect(productsService.addStock).not.toHaveBeenCalled();
  });

  it("does not show one seller another seller's charge", async () => {
    const { service } = setup();
    await expect(service.status({ sub: 99, role: 'cashier' }, 1)).rejects.toThrow();
  });
});
