import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    return this.productRepo.find({
      loadRelationIds: { relations: ['categories', 'brand'] },
    });
  }

  findByBrand(idBrand: number) {
    return this.brandService.findOne(idBrand);
  }

  public async findOne(idProduct: number) {
    const product = await this.productRepo.findOne({
      relations: ['categories', 'brand'],
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
    if (payload.categtoryIds) {
      const categories = await this.categoryService.findByIds(
        payload.categtoryIds,
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
    if (payload.categtoryIds) {
      const categories = await this.categoryService.findByIds(
        payload.categtoryIds,
      );
      product.categories = categories;
    }
    this.productRepo.merge(product, payload);
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
