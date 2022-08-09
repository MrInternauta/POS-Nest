import { Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { CustomersService } from './services/customers.service';
import { ProductsModule } from '../products/products.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Customer } from './entities/customer.entity';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';
import { OrderService } from './services/order.service';
import { OrdersController } from './controllers/orders.controller';
import { OrderItemService } from './services/order-item.service';
import { CustomerController } from './controllers/customers.controller';

@Module({
  imports: [
    ProductsModule,
    TypeOrmModule.forFeature([User, Customer, Order, OrderItem]),
  ],
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
