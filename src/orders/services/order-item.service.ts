import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { ProductsService } from '../../products/services/products.service';
import { CreateOrderItemDto, UpdateOrderItemDto } from '../dtos/order-item.dto';
import { OrderItem } from '../entities/order-item.entity';
import { OrderService } from './order.service';

@Injectable()
export class OrderItemService {
  constructor(
    @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
    @Inject(forwardRef(() => OrderService))
    private orderService: OrderService,
    private productService: ProductsService
  ) {}

  async findOne(orderItemId: number) {
    const order = await this.orderItemRepo.findOne({
      relations: ['product'],
      where: { id: orderItemId },
    });
    if (!order) {
      throw new NotFoundException(`OrderItem ${orderItemId} not found`);
    }
    return order;
  }

  async create(orderId: number, createOrderItem: CreateOrderItemDto) {
    const product = await this.productService.withStock(createOrderItem.productId, createOrderItem.quantity);
    //quit categories/brand

    const order = await this.orderService.findOne(orderId, false);
    //Quit customer

    let newOrderItem = this.orderItemRepo.create({
      product,
      quantity: createOrderItem.quantity,
      order,
    });

    this.productService.quitStock(createOrderItem.productId, createOrderItem.quantity);
    newOrderItem = await this.orderItemRepo.save(newOrderItem);
    delete newOrderItem.order;
    return newOrderItem;
  }

  public async update(id: number, updateOrderItemDto: UpdateOrderItemDto) {
    const orderItem = await this.findOne(id);
    await this.remove(id);
    this.productService.addStock(orderItem.product.id, orderItem.quantity);
    try {
      return await this.create(orderItem.order.id, updateOrderItemDto as CreateOrderItemDto);
    } catch (error) {
      this.orderItemRepo.restore({ id });
      throw error;
    }
  }

  public async remove(id: number) {
    await this.findOne(id);
    return this.orderItemRepo.softDelete({ id });
  }
}
