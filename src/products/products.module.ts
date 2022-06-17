import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CategoriesController } from './controllers/categories/categories.controller';
import { OrdersController } from './controllers/orders/orders.controller';
import { ProductsController } from './controllers/products/products.controller';
import { CostumersController } from './controllers/costumers/costumers.controller';
import { BrandsController } from './controllers/brands/brands.controller';
import { UsersController } from './controllers/users/users.controller';

import { ProductsService } from './services/products.service';
import { Product } from './entities/product.entity';
@Module({
  providers: [ProductsService],
  imports: [TypeOrmModule.forFeature([Product])],
  exports: [ProductsService],
  controllers: [
    ProductsController,
    CategoriesController,
    BrandsController,
    UsersController,
    CostumersController,
    OrdersController,
  ],
})
export class ProductsModule {}
