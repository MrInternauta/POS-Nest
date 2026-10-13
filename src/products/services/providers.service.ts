import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { FilterDto } from '../../core/interfaces/filter.dto';
import { CreateProviderDto, UpdateProviderDto } from '../dtos/provider.dto';
import { Provider } from '../entities/provider.entity';

/** Every method works within one store: a provider of another store answers like a missing one */
@Injectable()
export class ProvidersService {
  constructor(@InjectRepository(Provider) private providerRepo: Repository<Provider>) {}

  findAll(storeId: number, params?: FilterDto) {
    const { limit, offset } = params ?? {};
    return this.providerRepo.find({
      where: { store: { id: storeId } },
      take: limit,
      skip: offset,
      order: { name: 'ASC', id: 'ASC' },
    });
  }

  async findOne(storeId: number, id: number) {
    const provider = await this.providerRepo.findOne({ where: { id, store: { id: storeId } } });
    if (!provider) {
      throw new NotFoundException(`Provider ${id} not found`);
    }
    return provider;
  }

  /**
   * A soft deleted provider still holds its name, so it counts too. The provider being edited
   * may keep the name it already has.
   */
  async validateUniqueName(storeId: number, name: string, exceptId?: number) {
    const existing = await this.providerRepo.findOne({ where: { name, store: { id: storeId } }, withDeleted: true });
    if (existing && existing.id !== exceptId) {
      throw new BadRequestException(`Provider with name '${name}' already exists`);
    }
  }

  async create(storeId: number, payload: CreateProviderDto) {
    await this.validateUniqueName(storeId, payload.name);
    return this.providerRepo.save(this.providerRepo.create({ ...payload, store: { id: storeId } }));
  }

  async update(storeId: number, id: number, changes: UpdateProviderDto) {
    const provider = await this.findOne(storeId, id);
    if (changes.name !== undefined) {
      await this.validateUniqueName(storeId, changes.name, id);
    }
    this.providerRepo.merge(provider, changes);
    return this.providerRepo.save(provider);
  }

  async remove(storeId: number, id: number) {
    await this.findOne(storeId, id);
    return this.providerRepo.softDelete({ id });
  }

  async restore(storeId: number, id: number) {
    const deleted = await this.providerRepo.findOne({ where: { id, store: { id: storeId } }, withDeleted: true });
    if (!deleted) {
      throw new NotFoundException(`Provider ${id} not found`);
    }
    return this.providerRepo.restore({ id });
  }
}
