import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductsModule } from '../products/products.module';
import { CustomerController } from './controllers/customers.controller';
import { OrdersController } from './controllers/orders.controller';
import { UsersController } from './controllers/users.controller';
import { Customer } from './entities/customer.entity';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';
import { User } from './entities/user.entity';
import { CustomersService } from './services/customers.service';
import { OrderItemService } from './services/order-item.service';
import { OrderService } from './services/order.service';
import { UsersService } from './services/users.service';

@Module({
  imports: [
    ProductsModule,
    TypeOrmModule.forFeature([User, Customer, Order, OrderItem]),
  ],
  exports: [UsersService],
  providers: [
    UsersService,
    CustomersService,
    OrderService,
    OrderItemService,
    // {
    // 	provide: ProducsService, // Nombre con el que haremos referencia a ella
    // 	useClass: ProducsService // Nombre de la clase que se usara
    // }
  ], // Aqui por ejemplo],
  controllers: [UsersController, OrdersController, CustomerController],
})
export class UsersModule {}
