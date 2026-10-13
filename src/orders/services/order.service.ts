import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { FilterDto } from '../../core/interfaces/filter.dto';
import { CreateOrderItemDto } from '../../orders/dtos/order-item.dto';
import { Order } from '../../orders/entities/order.entity';
import { ProductsService } from '../../products/services/products.service';
import { StoresService } from '../../stores/services/stores.service';
import { User } from '../../users/entities/user.entity';
import { CreateOrderDto, UpdateOrderDto } from '../dtos/order.dto';
import { OrderItemService } from './order-item.service';

const DEFAULT_LIMIT = 10;

/**
 * Every method works within one store. With a `sellerId` it also works only among the orders that
 * user made: someone else's order answers exactly like a missing one, so nobody learns which ids
 * are taken. Without it (an owner), any order of the store is reachable.
 */
@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @Inject(forwardRef(() => OrderItemService))
    private orderItemService: OrderItemService,
    private storesService: StoresService,
    private productsService: ProductsService
  ) {}

  /**
   * The seller is not optional: typeorm reads `{ user: { id: undefined } }` as no condition at all,
   * so a caller that forgot to say whose orders these are used to get everyone's back without a
   * word. Asking for the id up front is what keeps that from happening again.
   */
  findAll(storeId: number, sellerId: number, params?: FilterDto) {
    const { limit, offset } = params ?? {};
    return this.orderRepo.find({
      take: limit ?? DEFAULT_LIMIT,
      skip: offset ?? 0,
      relations: ['items', 'items.product', 'customer'],
      where: { store: { id: storeId }, user: { id: sellerId } },
      //Newest first, so the history opens on the order that was just paid
      order: { createAt: 'DESC', id: 'DESC' },
    });
  }

  async findOne(storeId: number, orderId: number, withRelations = true, sellerId?: number) {
    const order = await this.orderRepo.findOne({
      relations: withRelations ? ['items', 'items.product', 'customer'] : [],
      where: {
        id: orderId,
        store: { id: storeId },
        ...(sellerId === undefined ? {} : { user: { id: sellerId } }),
      },
    });
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    return order;
  }

  /** A sale in `storeId` made by `sellerId`, to the customer named or the store's default one */
  async create(storeId: number, sellerId: number, createOrderDto: CreateOrderDto) {
    if (!createOrderDto.items?.length) {
      throw new BadRequestException('Should be items inside the order');
    }

    //Every line is checked before anything is written: an order whose lines failed used to stay
    //behind empty, and counted as a sale in the reports
    const wanted = new Map<number, number>();
    for (const item of createOrderDto.items) {
      wanted.set(item.productId, (wanted.get(item.productId) ?? 0) + item.quantity);
    }
    for (const [productId, quantity] of wanted) {
      await this.productsService.withStock(storeId, productId, quantity);
    }

    const customer = createOrderDto.customerId
      ? await this.storesService.findCustomer(storeId, createOrderDto.customerId)
      : await this.storesService.defaultCustomer(storeId);

    const orderCreated = await this.orderRepo.save(
      this.orderRepo.create({ user: { id: sellerId }, store: { id: storeId }, customer })
    );

    for (const item of createOrderDto.items) {
      await this.orderItemService.create(storeId, orderCreated.id, item);
    }

    return this.findOne(storeId, orderCreated.id);
  }

  /** Hands the order to another member of the store */
  async update(storeId: number, orderId: number, updateOrderDto: UpdateOrderDto) {
    const order = await this.findOne(storeId, orderId);
    if (updateOrderDto.userId !== undefined) {
      const user = await this.userRepo.findOneBy({ id: updateOrderDto.userId });
      if (!user || !(await this.storesService.isMember(storeId, user.id))) {
        throw new BadRequestException(`User ${updateOrderDto.userId} does not work in this store`);
      }
      order.user = user;
    }
    if (updateOrderDto.customerId !== undefined) {
      order.customer = await this.storesService.findCustomer(storeId, updateOrderDto.customerId);
    }
    return this.orderRepo.save(order);
  }

  async removeItem(storeId: number, orderId: number, itemId: number, sellerId?: number) {
    const order = await this.findOne(storeId, orderId, true, sellerId);
    order.items = order.items.filter(item => item.id !== itemId);
    return this.orderRepo.save(order);
  }

  async addItem(storeId: number, orderId: number, createOrderItem: CreateOrderItemDto, sellerId?: number) {
    await this.findOne(storeId, orderId, false, sellerId);
    return this.orderItemService.create(storeId, orderId, createOrderItem);
  }

  public async remove(storeId: number, id: number, sellerId?: number) {
    await this.findOne(storeId, id, false, sellerId);
    return this.orderRepo.softDelete({ id });
  }
}
