import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import {
  CreateProductDto,
  UpdateProductDto,
} from 'src/products/dtos/product.dto';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
  ) {}

  public findAll(page: number, limit: number) {
    return this.productRepo.find();
    // const end = page * limit;
    // const start = end - limit;
    // return this.products.slice(start, end);
  }

  public async findOne(idProduct: number) {
    const product = await this.productRepo.findOneBy({
      id: idProduct,
    });
    if (!product) {
      throw new NotFoundException('Not found product');
    }
    return product;
  }

  public async create(payload: CreateProductDto) {
    // const product = new Product();
    // product.name = payload.name;
    // product.description = payload.description;
    // product.price = payload.price;
    // product.stock = product.stock;
    // product.image = product.image;
    const product = this.productRepo.create(payload);
    return this.productRepo.save(product);
  }

  public async update(id: number, payload: UpdateProductDto) {
    const product = await this.productRepo.findOneBy({ id });
    if (!product) {
      return false;
    }
    this.productRepo.merge(product, payload);
    return await this.productRepo.save(product);
  }

  public async delete(id: number) {
    return !!(await this.productRepo.delete({ id }));
  }
}
