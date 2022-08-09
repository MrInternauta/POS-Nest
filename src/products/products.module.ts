import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CategoriesController } from './controllers/categories/categories.controller';
import { ProductsController } from './controllers/products/products.controller';
import { BrandsController } from './controllers/brands/brands.controller';

import { ProductsService } from './services/products.service';
import { Product } from './entities/product.entity';
import { Brand } from './entities/brand.entity';
import { Category } from './entities/category.entity';
import { CategoriesService } from './services/categories.service';
import { BrandsService } from './services/brands.service';
@Module({
  providers: [ProductsService, CategoriesService, BrandsService],
  imports: [TypeOrmModule.forFeature([Product, Brand, Category])],
  exports: [ProductsService],
  controllers: [ProductsController, CategoriesController, BrandsController],
})
export class ProductsModule {}
