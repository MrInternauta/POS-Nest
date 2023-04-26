import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BrandsController } from './controllers/brands.controller';
import { CategoriesController } from './controllers/categories.controller';
import { ProductsController } from './controllers/products.controller';
import { Brand } from './entities/brand.entity';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { BrandsService } from './services/brands.service';
import { CategoriesService } from './services/categories.service';
import { ProductsService } from './services/products.service';

@Module({
  providers: [ProductsService, CategoriesService, BrandsService],
  imports: [TypeOrmModule.forFeature([Product, Brand, Category])],
  exports: [ProductsService, CategoriesService, BrandsService],
  controllers: [ProductsController, CategoriesController, BrandsController],
})
export class ProductsModule {}
