import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Role } from '../../core/auth/models/roles.model';
import { PayloadToken } from '../../core/auth/models/token.model';
import { CreateOrderItemDto } from '../../orders/dtos/order-item.dto';
import { Order, PaymentMethod, PaymentStatus } from '../../orders/entities/order.entity';
import { OrderService } from '../../orders/services/order.service';
import { ProductsService } from '../../products/services/products.service';
import { UpdateStoreSettingsDto } from '../dtos/payment.dto';
import { StoreSetting } from '../entities/store-setting.entity';
import { MercadoPagoClient, MpOrder } from './mercado-pago.client';

const SETTINGS_ID = 1;

/** What a Mercado Pago order status means for the sale; a status not listed leaves it pending */
const STATUS_FROM_MP: Record<string, PaymentStatus> = {
  processed: PaymentStatus.PAID,
  canceled: PaymentStatus.CANCELED,
  expired: PaymentStatus.CANCELED,
  failed: PaymentStatus.FAILED,
};

/**
 * Charging a sale on a Mercado Pago Point terminal.
 *
 * The sale is saved as pending before the terminal is asked for the money, and its stock comes
 * out right then, so two cashiers cannot sell the last unit while one of them waits on a card.
 * If the payment fails, is canceled or expires, the stock goes back. Every change out of pending
 * goes through `settle`, which moves the sale only if it is still pending, so a webhook, a poll
 * and a cancel arriving together put the stock back once.
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(StoreSetting) private settingsRepo: Repository<StoreSetting>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    private orderService: OrderService,
    private productsService: ProductsService,
    private mercadoPago: MercadoPagoClient
  ) {}

  async getSettings() {
    const settings = await this.settingsRepo.findOneBy({ id: SETTINGS_ID });
    return settings ?? this.settingsRepo.create({ id: SETTINGS_ID, mercadoPagoEnabled: false, mpTerminalId: null });
  }

  /** What the checkout needs to know: whether to offer Mercado Pago next to cash */
  async checkoutOptions() {
    const settings = await this.getSettings();
    return { mercadoPagoEnabled: this.canCharge(settings) };
  }

  async updateSettings(changes: UpdateStoreSettingsDto) {
    const settings = { ...(await this.getSettings()), ...changes };

    if (settings.mercadoPagoEnabled && !this.mercadoPago.isConfigured) {
      throw new BadRequestException('Mercado Pago has no access token on the server');
    }
    if (settings.mercadoPagoEnabled && !settings.mpTerminalId) {
      throw new BadRequestException('Choose a terminal before turning Mercado Pago on');
    }
    //Charges only reach a terminal in PDV mode; switching it is harmless when it already is
    if (changes.mpTerminalId) {
      await this.mercadoPago.setPdvMode(changes.mpTerminalId);
    }

    return this.settingsRepo.save(settings);
  }

  listTerminals() {
    return this.mercadoPago.listTerminals();
  }

  async charge(user: PayloadToken, items: CreateOrderItemDto[]) {
    const settings = await this.getSettings();
    if (!this.canCharge(settings)) {
      throw new BadRequestException('Mercado Pago is not turned on for this store');
    }

    const created = await this.orderService.create(
      { userId: user.sub, items },
      { paymentMethod: PaymentMethod.MP_POINT, paymentStatus: PaymentStatus.PENDING }
    );
    const sale = await this.orderService.findOne(created.id);

    try {
      const mpOrder = await this.mercadoPago.createPointOrder(
        sale.id,
        sale.total,
        settings.mpTerminalId,
        sale.items.map(item => `${item.quantity} ${item.product?.name}`).join(', ')
      );
      await this.orderRepo.update({ id: sale.id }, { mpOrderId: mpOrder.id });
      sale.mpOrderId = mpOrder.id;
    } catch (error) {
      //The terminal never got the charge, so nothing can pay for this sale
      await this.settle(sale.id, PaymentStatus.FAILED);
      throw error;
    }

    return this.describe(sale);
  }

  /**
   * The app polls this while the customer is at the terminal. It also asks Mercado Pago, so a
   * missed or late webhook does not leave the cashier waiting.
   */
  async status(user: PayloadToken, saleId: number) {
    const sale = await this.findOwnSale(user, saleId);

    if (sale.paymentStatus === PaymentStatus.PENDING && sale.mpOrderId) {
      const mpOrder = await this.mercadoPago.getOrder(sale.mpOrderId);
      sale.paymentStatus = await this.apply(sale.id, mpOrder);
    }
    return this.describe(sale);
  }

  async cancel(user: PayloadToken, saleId: number) {
    const sale = await this.findOwnSale(user, saleId);
    if (sale.paymentStatus !== PaymentStatus.PENDING) {
      return this.describe(sale);
    }

    if (sale.mpOrderId) {
      try {
        await this.mercadoPago.cancelOrder(sale.mpOrderId);
      } catch (error) {
        //Mercado Pago refuses once the customer has paid; whatever it says the order is, the sale follows
        sale.paymentStatus = await this.apply(sale.id, await this.mercadoPago.getOrder(sale.mpOrderId));
        if (sale.paymentStatus === PaymentStatus.PENDING) {
          throw error;
        }
        return this.describe(sale);
      }
    }

    await this.settle(sale.id, PaymentStatus.CANCELED);
    sale.paymentStatus = (await this.orderRepo.findOneBy({ id: sale.id })).paymentStatus;
    return this.describe(sale);
  }

  /**
   * A notification from Mercado Pago. Its body is not trusted: only the order id is taken from
   * it, after the signature checks out, and the order itself is fetched from Mercado Pago.
   */
  async handleWebhook(
    signature: string | undefined,
    requestId: string | undefined,
    dataId: string | undefined,
    type: string | undefined
  ) {
    if (!this.mercadoPago.isValidWebhookSignature(signature, requestId, dataId)) {
      this.logger.warn(`Webhook with a bad signature, request ${requestId}`);
      return false;
    }
    if (type !== 'order' || !dataId) {
      return true;
    }

    const sale = await this.orderRepo.findOneBy({ mpOrderId: dataId });
    if (!sale) {
      //An order made outside this app, or one whose id is not saved yet; nothing here to update
      return true;
    }
    await this.apply(sale.id, await this.mercadoPago.getOrder(dataId));
    return true;
  }

  /** Moves the sale to what the Mercado Pago order says, and returns the sale's status after it */
  private async apply(saleId: number, mpOrder: MpOrder) {
    const next = STATUS_FROM_MP[mpOrder?.status];
    if (next) {
      await this.settle(saleId, next);
    }
    return (await this.orderRepo.findOneBy({ id: saleId })).paymentStatus;
  }

  /**
   * Takes a pending sale to its final status. The update only matches a sale that is still
   * pending, so of several callers racing here exactly one moves it, and only that one puts the
   * stock back.
   */
  private async settle(saleId: number, next: PaymentStatus) {
    const result = await this.orderRepo.update(
      { id: saleId, paymentStatus: PaymentStatus.PENDING },
      { paymentStatus: next }
    );
    if (!result.affected || next === PaymentStatus.PAID) {
      return;
    }

    const sale = await this.orderService.findOne(saleId);
    for (const item of sale.items) {
      await this.productsService.addStock(item.product.id, item.quantity);
    }
  }

  private async findOwnSale(user: PayloadToken, saleId: number) {
    const sale = await this.orderRepo.findOne({ where: { id: saleId }, relations: ['user', 'items', 'items.product'] });
    if (!sale || sale.paymentMethod !== PaymentMethod.MP_POINT) {
      throw new NotFoundException(`Payment ${saleId} not found`);
    }
    if (sale.user?.id !== user.sub && user.role?.toLowerCase() !== Role.ADMIN) {
      throw new ForbiddenException();
    }
    return sale;
  }

  private canCharge(settings: StoreSetting) {
    return settings.mercadoPagoEnabled && !!settings.mpTerminalId && this.mercadoPago.isConfigured;
  }

  private describe(sale: Order) {
    return {
      id: sale.id,
      paymentMethod: sale.paymentMethod,
      paymentStatus: sale.paymentStatus,
      total: sale.total,
    };
  }
}
