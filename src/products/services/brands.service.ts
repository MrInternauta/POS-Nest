import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBrandDto, UpdateBrandDto } from '../dtos/brand.dto';

import { Brand } from '../entities/brand.entity';

@Injectable()
export class BrandsService {
  constructor(@InjectRepository(Brand) private brandsRepo: Repository<Brand>) {}

  findAll() {
    return this.brandsRepo.find({
      relations: ['products'],
    });
  }

  findOne(id: number) {
    const product = this.brandsRepo.findOneBy({
      id,
    });
    if (!product) {
      throw new NotFoundException(`Brand #${id} not found`);
    }
    return product;
  }

  create(data: CreateBrandDto) {
    const newBrand = this.brandsRepo.create(data);
    return this.brandsRepo.save(newBrand);
  }

  async update(id: number, changes: UpdateBrandDto) {
    const brand = await this.findOne(id);
    if (!brand) {
      throw new NotFoundException(`Brand #${id} not found`);
    }
    this.brandsRepo.merge(brand, changes);
    return this.brandsRepo.save(brand);
  }

  async remove(id: number) {
    const brand = await this.brandsRepo.findOneBy({ id });
    if (!brand) {
      throw new NotFoundException(`Brand${id} not found`);
    } else {
      return this.brandsRepo.softDelete({ id });
    }
  }
}
