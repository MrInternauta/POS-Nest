import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CatalogController } from './controllers/catalog.controller';
import { CategoriesController } from './controllers/categories.controller';
import { ProductsController } from './controllers/products.controller';
import { ProvidersController } from './controllers/providers.controller';
import { StoresModule } from '../stores/stores.module';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { Provider } from './entities/provider.entity';
import { CategoriesService } from './services/categories.service';
import { ProductsService } from './services/products.service';
import { ProvidersService } from './services/providers.service';

@Module({
  providers: [ProductsService, CategoriesService, ProvidersService],
  imports: [TypeOrmModule.forFeature([Product, Category, Provider]), StoresModule],
  exports: [ProductsService, CategoriesService, ProvidersService],
  controllers: [ProductsController, CategoriesController, ProvidersController, CatalogController],
})
export class ProductsModule {}
