import { Module } from '@nestjs/common';
import { CategoriesController } from './categories/categories.controller';
import { ProductsController } from './products/products.controller';
import { BrandsController } from './brands/brands.controller';
import { UsersController } from './users/users.controller';
import { CostumersController } from './costumers/costumers.controller';
import { OrdersController } from './orders/orders.controller';
import { AppController } from './app.controller';
import { AppService } from 'src/app.service';

@Module({
  controllers: [
    AppController,
    ProductsController,
    CategoriesController,
    BrandsController,
    UsersController,
    CostumersController,
    OrdersController,
  ],
  providers: [AppService],
})
export class ControllersModule {}
