import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { FilterDto } from '../../core/interfaces/filter.dto';
import { CreateCategoryDto, UpdateCategoryDto } from '../dtos/category.dto';
import { Category } from '../entities/category.entity';

/** Every method works within one store: a category of another store answers like a missing one */
@Injectable()
export class CategoriesService {
  constructor(@InjectRepository(Category) private categoryRepo: Repository<Category>) {}

  findAll(storeId: number, params?: FilterDto) {
    const { limit, offset } = params ?? {};
    return this.categoryRepo.find({
      where: { store: { id: storeId } },
      take: limit,
      skip: offset,
      order: { name: 'ASC', id: 'ASC' },
    });
  }

  async findOne(storeId: number, id: number, withProducts = true) {
    const category = await this.categoryRepo.findOne({
      relations: withProducts ? ['products'] : [],
      where: { id, store: { id: storeId } },
    });
    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }
    return category;
  }

  findOnebyName(storeId: number, name: string) {
    return this.categoryRepo.find({
      where: { name, store: { id: storeId } },
      take: 1,
      withDeleted: true,
    });
  }

  /** The category being edited may keep the name it already has */
  async validateUniqueName(storeId: number, name: string, exceptId?: number) {
    const items = await this.findOnebyName(storeId, name);
    if (items && items.length > 0 && items[0].id !== exceptId) {
      throw new BadRequestException(`Category with name '${name}' already exists`);
    }
  }

  async create(storeId: number, category: CreateCategoryDto) {
    await this.validateUniqueName(storeId, category.name);
    const newCategory = this.categoryRepo.create({ ...category, store: { id: storeId } });
    return await this.categoryRepo.save(newCategory);
  }

  async update(storeId: number, id: number, changes: UpdateCategoryDto) {
    //Without a name in the changes the lookup would match any category
    if (changes.name !== undefined) {
      await this.validateUniqueName(storeId, changes.name, id);
    }
    const category = await this.findOne(storeId, id, false);
    this.categoryRepo.merge(category, changes);
    return this.categoryRepo.save(category);
  }

  async remove(storeId: number, id: number) {
    await this.findOne(storeId, id, false);
    return this.categoryRepo.softDelete({ id });
  }

  async restore(storeId: number, id: number) {
    const deleted = await this.categoryRepo.findOne({ where: { id, store: { id: storeId } }, withDeleted: true });
    if (!deleted) {
      throw new NotFoundException(`Category ${id} not found`);
    }
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
