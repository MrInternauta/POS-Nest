import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { FilterDto } from '../../core/interfaces/filter.dto';
import { CreateOrderItemDto } from '../../orders/dtos/order-item.dto';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../users/entities/user.entity';
import { CreateOrderDto, UpdateOrderDto } from '../dtos/order.dto';
import { OrderItemService } from './order-item.service';

const DEFAULT_LIMIT = 10;

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @Inject(forwardRef(() => OrderItemService))
    private orderItemService: OrderItemService
  ) {}

  /**
   * The owner is not optional: typeorm reads `{ user: { id: undefined } }` as no condition at all,
   * so a caller that forgot to say whose orders these are used to get everyone's back without a
   * word. Asking for the id up front is what keeps that from happening again.
   */
  findAll(userId: number, params?: FilterDto) {
    const { limit, offset } = params ?? {};
    return this.orderRepo.find({
      take: limit ?? DEFAULT_LIMIT,
      skip: offset ?? 0,
      relations: ['items', 'items.product'],
      where: { user: { id: userId } },
      //Newest first, so the history opens on the order that was just paid
      order: { createAt: 'DESC', id: 'DESC' },
      // relations: ['items'],
    });
  }

  /**
   * With an `ownerId`, an order of someone else answers exactly like one that does not exist, so
   * nobody learns which ids are taken. Without it (an admin), any order is found.
   */
  async findOne(orderId: number, withRelations = true, ownerId?: number) {
    const order = await this.orderRepo.findOne({
      relations: withRelations ? ['items', 'items.product'] : [],
      where: ownerId === undefined ? { id: orderId } : { id: orderId, user: { id: ownerId } },
    });
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    return order;
  }

  async create(createOrderDto: CreateOrderDto) {
    const user = await this.userRepo.findOneBy({ id: createOrderDto.userId });
    if (!createOrderDto.items) {
      throw new BadRequestException('Should be items inside the order');
    }
    const newOrder = this.orderRepo.create({ user });
    const orderCreated = await this.orderRepo.save(newOrder);

    if (!orderCreated) {
      throw new BadRequestException(`Cannot create order`);
    }
    const itemsPromises = createOrderDto.items.map(item => {
      return this.addItem(orderCreated.id, item);
    });

    const result = await Promise.all(itemsPromises);
    newOrder.items = result;

    return orderCreated;
  }

  async update(orderId: number, updateOrderDto: UpdateOrderDto) {
    const order = await this.findOne(orderId);
    const user = await this.userRepo.findOneBy({ id: updateOrderDto.userId });
    order.user = user;
    return this.orderRepo.save(order);
  }

  async removeItem(orderId: number, itemId: number, ownerId?: number) {
    const order = await this.findOne(orderId, true, ownerId);
    order.items = order.items.filter(item => item.id !== itemId);
    return this.orderRepo.save(order);
  }

  async addItem(orderId: number, createOrderItem: CreateOrderItemDto, ownerId?: number) {
    if (ownerId !== undefined) {
      await this.findOne(orderId, false, ownerId);
    }
    return this.orderItemService.create(orderId, createOrderItem);
  }

  public async remove(id: number, ownerId?: number) {
    await this.findOne(id, false, ownerId);
    return this.orderRepo.softDelete({ id });
  }

  public async restore(id: number) {
    return this.orderRepo.restore({ id });
  }
}
