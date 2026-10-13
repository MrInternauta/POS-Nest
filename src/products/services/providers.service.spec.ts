import { BadRequestException, NotFoundException } from '@nestjs/common';

import { Repository } from 'typeorm';

import { StoresService } from '../../stores/services/stores.service';
import { Provider } from '../entities/provider.entity';
import { ProvidersService } from './providers.service';

/** Just the repository calls the service makes, backed by a list */
const repoWith = (rows: Partial<Provider>[]) =>
  ({
    findOne: jest.fn(async ({ where, withDeleted }) =>
      rows.find(
        row => (withDeleted || !row.deletedAt) && Object.entries(where).every(([key, value]) => row[key] === value)
      )
    ),
    create: jest.fn(payload => ({ ...payload })),
    merge: jest.fn((target, changes) => Object.assign(target, changes)),
    save: jest.fn(async entity => entity),
    softDelete: jest.fn(async () => ({ affected: 1 })),
  } as unknown as Repository<Provider>);

/** Everything lands in the main store until requests carry theirs */
const mainStoreOnly = { mainStore: async () => ({ id: 1 }) } as unknown as StoresService;
const providersWith = (repo: Repository<Provider>) => new ProvidersService(repo, mainStoreOnly);

describe('ProvidersService', () => {
  it('creates a provider with a new name', async () => {
    const service = providersWith(repoWith([]));

    await expect(service.create({ name: 'Bimbo', phone: '555 123 4567' })).resolves.toMatchObject({
      name: 'Bimbo',
      phone: '555 123 4567',
    });
  });

  it('refuses a name another provider has, even a deleted one', async () => {
    const service = providersWith(repoWith([{ id: 1, name: 'Bimbo', deletedAt: new Date() }]));

    await expect(service.create({ name: 'Bimbo' })).rejects.toThrow(BadRequestException);
  });

  it('lets a provider keep its own name when other fields change', async () => {
    const service = providersWith(repoWith([{ id: 1, name: 'Bimbo' }]));

    await expect(service.update(1, { name: 'Bimbo', contactName: 'Ana' })).resolves.toMatchObject({
      name: 'Bimbo',
      contactName: 'Ana',
    });
  });

  it('updates without a name in the changes', async () => {
    const service = providersWith(
      repoWith([
        { id: 1, name: 'Bimbo' },
        { id: 2, name: 'Coca-Cola' },
      ])
    );

    await expect(service.update(2, { phone: '555 000 0000' })).resolves.toMatchObject({ phone: '555 000 0000' });
  });

  it('refuses renaming a provider to the name of another', async () => {
    const service = providersWith(
      repoWith([
        { id: 1, name: 'Bimbo' },
        { id: 2, name: 'Coca-Cola' },
      ])
    );

    await expect(service.update(2, { name: 'Bimbo' })).rejects.toThrow(BadRequestException);
  });

  it('answers not found for a provider that is not there', async () => {
    const service = providersWith(repoWith([]));

    await expect(service.findOne(9)).rejects.toThrow(NotFoundException);
    await expect(service.remove(9)).rejects.toThrow(NotFoundException);
  });
});
