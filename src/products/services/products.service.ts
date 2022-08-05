import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import {
  CreateProductDto,
  UpdateProductDto,
} from '../../products/dtos/product.dto';
import { Product } from '../entities/product.entity';
import { BrandsService } from './brands.service';
import { CategoriesService } from './categories.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    private categoryService: CategoriesService,
    private brandService: BrandsService,
  ) {}

  public findAll(page = 1, limit = 10) {
    return this.productRepo.find({ relations: ['category', 'brand'] });
  }

  findByCategory(idCategory: number) {
    return this.productRepo.find({
      where: { category: { id: idCategory } },
      relations: ['category', 'brand'],
    });
  }

  findByBrand(idBrand: number) {
    return this.productRepo.find({
      where: { brand: { id: idBrand } },
      relations: ['category', 'brand'],
    });
  }

  public async findOne(idProduct: number) {
    const product = await this.productRepo.findOneBy({
      id: idProduct,
    });
    if (!product) {
      throw new NotFoundException('Not found product');
    } else {
      return product;
    }
  }

  public async create(payload: CreateProductDto) {
    const product = this.productRepo.create(payload);
    if (payload.brandId) {
      const brand = await this.brandService.findOne(payload.brandId);
      product.brand = brand;
    }
    if (payload.categtoryId) {
      const category = await this.categoryService.findOne(payload.categtoryId);
      product.category = category;
    } else {
      return this.productRepo.save(product);
    }
  }

  public async update(id: number, payload: UpdateProductDto) {
    const product = await this.productRepo.findOneBy({ id });
    if (!product) {
      throw new NotFoundException('Not found product');
    }
    if (payload.brandId) {
      const brand = await this.brandService.findOne(payload.brandId);
      product.brand = brand;
    }
    if (payload.categtoryId) {
      const category = await this.categoryService.findOne(payload.categtoryId);
      product.category = category;
    }
    this.productRepo.merge(product, payload);
    return this.productRepo.save(product);
  }

  public async remove(id: number) {
    const product = await this.productRepo.findOneBy({ id });
    if (!product) {
      throw new NotFoundException('Not found product');
    } else {
      return this.productRepo.softDelete({ id });
    }
  }
}
