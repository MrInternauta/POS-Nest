import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateBrandDto, UpdateBrandDto } from '../dtos/brand.dto';
import { Brand } from '../entities/brand.entity';

@Injectable()
export class BrandsService {
  constructor(@InjectRepository(Brand) private brandsRepo: Repository<Brand>) {}

  findAll() {
    return this.brandsRepo.find();
  }

  async findOne(id: number, withProducts = true) {
    const product = await this.brandsRepo.findOne({
      where: { id },
      relations: withProducts ? ['products'] : [],
    });
    if (!product) {
      throw new NotFoundException(`Brand ${id} not found`);
    }
    return product;
  }

  findOnebyName(name: string) {
    return this.brandsRepo.find({
      where: { name },
      take: 1,
      withDeleted: true,
    });
  }

  async validateUniqueName(name: string) {
    const items = await this.findOnebyName(name);
    if (items && items.length > 0) {
      throw new BadRequestException(`Brand with name '${name}' already exists`);
    }
  }

  async create(data: CreateBrandDto) {
    await this.validateUniqueName(data.name);
    const newBrand = this.brandsRepo.create(data);
    return this.brandsRepo.save(newBrand);
  }

  async update(id: number, changes: UpdateBrandDto) {
    await this.validateUniqueName(changes.name);
    const brand = await this.findOne(id);
    this.brandsRepo.merge(brand, changes);
    return this.brandsRepo.save(brand);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.brandsRepo.softDelete({ id });
  }
  async restore(id: number) {
    return this.brandsRepo.restore({ id });
  }
}
