import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { CreateCategoryDto, UpdateCategoryDto } from '../dtos/category.dto';
import { Category } from '../entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
  ) {}

  findAll() {
    return this.categoryRepo.find();
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

  findByIds(categoryIds: number[]) {
    return this.categoryRepo.findBy({ id: In(categoryIds) });
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
      throw new BadRequestException(
        `Category with name '${name}' already exists`,
      );
    }
  }

  async create(category: CreateCategoryDto) {
    await this.validateUniqueName(category.name);
    const newCategory = this.categoryRepo.create(category);
    return this.categoryRepo.save(newCategory);
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
}
