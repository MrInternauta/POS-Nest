import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { FilterDto } from '../../core/interfaces/filter.dto';
import { CreateCategoryDto, UpdateCategoryDto } from '../dtos/category.dto';
import { Category } from '../entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(@InjectRepository(Category) private categoryRepo: Repository<Category>) {}

  findAll(params?: FilterDto) {
    const { limit, offset } = params;
    return this.categoryRepo.find({
      take: limit,
      skip: offset,
    });
  }

  async findOne(id: number, withProducts = true) {
    const category = await this.categoryRepo.findOne({
      relations: withProducts ? ['products'] : [],
      where: { id },
    });
    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }
    return category;
  }

  findById(categoryId: number) {
    return this.categoryRepo.findOneBy({ id: categoryId });
  }

  findOnebyName(name: string) {
    return this.categoryRepo.find({
      where: { name },
      take: 1,
      withDeleted: true,
    });
  }

  async validateUniqueName(name: string) {
    const items = await this.findOnebyName(name);
    if (items && items.length > 0) {
      throw new BadRequestException(`Category with name '${name}' already exists`);
    }
  }

  async create(category: CreateCategoryDto) {
    await this.validateUniqueName(category.name);
    const newCategory = this.categoryRepo.create(category);
    return await this.categoryRepo.save(newCategory);
  }

  async update(id: number, changes: UpdateCategoryDto) {
    await this.validateUniqueName(changes.name);
    const category = await this.findOne(id);
    this.categoryRepo.merge(category, changes);
    return this.categoryRepo.save(category);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.categoryRepo.softDelete({ id });
  }

  async restore(id: number) {
    return this.categoryRepo.restore({ id });
  }

  defaultValue() {
    return [
      {
        name: 'PAN',
      },
      {
        name: 'TORTILLA',
      },
      {
        name: 'COCA-COLA',
      },
      {
        name: 'ABAROTES',
      },
      {
        name: 'MARINELA-BIMBO',
      },
      {
        name: 'DULCES',
      },
      {
        name: 'AGUA',
      },
      {
        name: 'OTROS',
      },
    ];
  }
}
