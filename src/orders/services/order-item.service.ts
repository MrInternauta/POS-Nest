import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { ProductsService } from '../../products/services/products.service';
import { CreateOrderItemDto } from '../dtos/order-item.dto';
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

  /** A line of an order of `storeId`, for a product of the same store */
  async create(storeId: number, orderId: number, createOrderItem: CreateOrderItemDto) {
    const product = await this.productService.withStock(storeId, createOrderItem.productId, createOrderItem.quantity);

    const order = await this.orderService.findOne(storeId, orderId, false);
    //Quit customer

    let newOrderItem = this.orderItemRepo.create({
      product,
      quantity: createOrderItem.quantity,
      unitPrice: product.priceSell,
      unitCost: product.price,
      order,
    });

    //Awaited: the answer used to go out while this was still in flight, so a client that read the
    //products again straight after a sale could still be served the stock from before it
    await this.productService.quitStock(storeId, createOrderItem.productId, createOrderItem.quantity);
    newOrderItem = await this.orderItemRepo.save(newOrderItem);
    delete newOrderItem.order;
    return newOrderItem;
  }

  public async remove(id: number) {
    await this.findOne(id);
    return this.orderItemRepo.softDelete({ id });
  }
}
