import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { FilterDto } from '../../core/interfaces/filter.dto';
import { CreateProviderDto, UpdateProviderDto } from '../dtos/provider.dto';
import { StoresService } from '../../stores/services/stores.service';
import { Provider } from '../entities/provider.entity';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(Provider) private providerRepo: Repository<Provider>,
    private storesService: StoresService
  ) {}

  findAll(params?: FilterDto) {
    const { limit, offset } = params ?? {};
    return this.providerRepo.find({
      take: limit,
      skip: offset,
      order: { name: 'ASC', id: 'ASC' },
    });
  }

  async findOne(id: number) {
    const provider = await this.providerRepo.findOne({ where: { id } });
    if (!provider) {
      throw new NotFoundException(`Provider ${id} not found`);
    }
    return provider;
  }

  /**
   * A soft deleted provider still holds its name, so it counts too. The provider being edited
   * may keep the name it already has.
   */
  async validateUniqueName(name: string, exceptId?: number) {
    const existing = await this.providerRepo.findOne({ where: { name }, withDeleted: true });
    if (existing && existing.id !== exceptId) {
      throw new BadRequestException(`Provider with name '${name}' already exists`);
    }
  }

  async create(payload: CreateProviderDto) {
    await this.validateUniqueName(payload.name);
    //Until requests carry their store everything goes to the main one
    const store = await this.storesService.mainStore();
    return this.providerRepo.save(this.providerRepo.create({ ...payload, store }));
  }

  async update(id: number, changes: UpdateProviderDto) {
    const provider = await this.findOne(id);
    if (changes.name !== undefined) {
      await this.validateUniqueName(changes.name, id);
    }
    this.providerRepo.merge(provider, changes);
    return this.providerRepo.save(provider);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.providerRepo.softDelete({ id });
  }

  restore(id: number) {
    return this.providerRepo.restore({ id });
  }
}
