import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOrderItemDto } from '../dtos/order-item.dto';
import { CreateOrderDto, UpdateOrderDto } from '../dtos/order.dto';
import { Order } from '../entities/order.entity';
import { CustomersService } from './customers.service';
import { OrderItemService } from './order-item.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,

    //Evite cicular dependency
    @Inject(forwardRef(() => CustomersService))
    private customerService: CustomersService,

    @Inject(forwardRef(() => OrderItemService))
    private orderItemService: OrderItemService,
  ) {}

  findAll(page = 1, limit = 10) {
    return this.orderRepo.find({
      loadRelationIds: { relations: ['items'] },
      relations: ['customer'],
    });
  }

  async findOne(orderId: number, withRelations = true) {
    const order = await this.orderRepo.findOne({
      relations: withRelations ? ['items', 'items.product'] : [],
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    return order;
  }

  async create(createOrderDto: CreateOrderDto) {
    const customer = await this.customerService.findOne(
      createOrderDto.customerId,
    );
    const newOrder = this.orderRepo.create({ customer });
    return this.orderRepo.save(newOrder);
  }

  async update(orderId: number, updateOrderDto: UpdateOrderDto) {
    const order = await this.findOne(orderId);
    const customer = await this.customerService.findOne(
      updateOrderDto.customerId,
    );
    order.customer = customer;
    return this.orderRepo.save(order);
  }

  async removeItem(orderId, itemId) {
    const order = await this.findOne(orderId);
    order.items = order.items.filter((item) => item.id !== itemId);
    return this.orderRepo.save(order);
  }

  async addItem(orderId: number, createOrderItem: CreateOrderItemDto) {
    return this.orderItemService.create(orderId, createOrderItem);
  }

  public async remove(id: number) {
    await this.findOne(id);
    return this.orderRepo.softDelete({ id });
  }

  public async restore(id: number) {
    return this.orderRepo.restore({ id });
  }
}
