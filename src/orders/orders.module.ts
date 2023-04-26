import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductsModule } from '../products/products.module';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { OrdersController } from './controllers/orders.controller';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';
import { OrderItemService } from './services/order-item.service';
import { OrderService } from './services/order.service';

@Module({
  imports: [ProductsModule, forwardRef(() => UsersModule), TypeOrmModule.forFeature([Order, OrderItem, User])],
  exports: [OrderItemService, OrderService],
  providers: [OrderService, OrderItemService],
  controllers: [OrdersController],
})
export class OrdersModule {}
