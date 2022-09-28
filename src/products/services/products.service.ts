import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, Repository } from 'typeorm';

import { CreateProductDto, UpdateProductDto } from '../../products/dtos/product.dto';
import { ProductsFilterDto } from '../dtos/productFilter.dto';
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

  public findAll(params?: ProductsFilterDto) {
    if (!params)
      return this.productRepo.find({
        loadRelationIds: { relations: ['categories', 'brand'] },
      });
    const where: FindOptionsWhere<Product> = {};
    const { limit, offset } = params;
    const { minPrice, maxPrice } = params;
    if (minPrice && maxPrice) {
      where.price = Between(minPrice, maxPrice);
    }
    return this.productRepo.find({
      loadRelationIds: { relations: ['categories', 'brand'] },
      take: limit,
      skip: offset,
      where,
    });
  }

  findByBrand(idBrand: number) {
    return this.brandService.findOne(idBrand);
  }

  public async findOne(idProduct: number, whithRelations = true) {
    const product = await this.productRepo.findOne({
      relations: whithRelations ? ['categories', 'brand'] : [],
      where: { id: idProduct },
    });
    if (!product) {
      throw new NotFoundException(`Product ${idProduct} not found`);
    } else {
      return product;
    }
  }

  findOnebyName(name: string) {
    return this.productRepo.find({
      where: { name },
      take: 1,
      withDeleted: true,
    });
  }

  async validateUniqueName(name: string) {
    const items = await this.findOnebyName(name);
    if (items && items.length > 0) {
      throw new BadRequestException(
        `Product with name '${name}' already exists`,
      );
    }
  }

  public async create(payload: CreateProductDto) {
    await this.validateUniqueName(payload.name);
    const product = this.productRepo.create(payload);
    if (payload.brandId) {
      const brand = await this.brandService.findOne(payload.brandId, false);
      product.brand = brand;
    }
    if (payload.categoryIds) {
      const categories = await this.categoryService.findByIds(
        payload.categoryIds,
      );
      product.categories = categories;
    }
    return this.productRepo.save(product);
  }

  public async update(id: number, payload: UpdateProductDto) {
    await this.validateUniqueName(payload.name);
    const product = await this.findOne(id);
    if (payload.brandId) {
      const brand = await this.brandService.findOne(payload.brandId, false);
      product.brand = brand;
    }
    if (payload.categoryIds) {
      const categories = await this.categoryService.findByIds(
        payload.categoryIds,
      );
      product.categories = categories;
    }
    this.productRepo.merge(product, payload);
    return this.productRepo.save(product);
  }

  async withStock(productId: number, quantity: number) {
    const product = await this.findOne(productId);
    if (product.stock < quantity)
      throw new BadRequestException(`Product ${product.name} without stock`);
    return product;
  }

  async quitStock(productId: number, quantity: number) {
    const product = await this.findOne(productId);
    product.stock = product.stock - quantity;
    return this.productRepo.save(product);
  }
  async addStock(productId: number, quantity: number) {
    const product = await this.findOne(productId);
    product.stock = product.stock + quantity;
    return this.productRepo.save(product);
  }

  async removeCategory(productId, categoryId) {
    const product = await this.findOne(productId);
    product.categories = product.categories.filter(
      (category) => category.id !== categoryId,
    );
    return this.productRepo.save(product);
  }

  async addCategory(productId, categoryId) {
    const product = await this.findOne(productId);
    const category = await this.categoryService.findOne(categoryId, false);
    product.categories.push(category);
    return this.productRepo.save(product);
  }

  public async remove(id: number) {
    await this.findOne(id);
    return this.productRepo.softDelete({ id });
  }

  public async restore(id: number) {
    return this.productRepo.restore({ id });
  }
}
