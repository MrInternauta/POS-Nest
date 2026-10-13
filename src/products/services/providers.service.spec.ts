import { BadRequestException, NotFoundException } from '@nestjs/common';

import { Repository } from 'typeorm';

import { Provider } from '../entities/provider.entity';
import { ProvidersService } from './providers.service';

type Row = Partial<Provider> & { storeId?: number };

/** Just the repository calls the service makes, backed by a list. A row is in store 1 unless it says */
const repoWith = (rows: Row[]) =>
  ({
    findOne: jest.fn(async ({ where, withDeleted }) =>
      rows.find(
        row =>
          (withDeleted || !row.deletedAt) &&
          Object.entries(where).every(([key, value]) =>
            key === 'store' ? (row.storeId ?? 1) === (value as { id: number }).id : row[key] === value
          )
      )
    ),
    create: jest.fn(payload => ({ ...payload })),
    merge: jest.fn((target, changes) => Object.assign(target, changes)),
    save: jest.fn(async entity => entity),
    softDelete: jest.fn(async () => ({ affected: 1 })),
  } as unknown as Repository<Provider>);

const providersWith = (repo: Repository<Provider>) => new ProvidersService(repo);

describe('ProvidersService', () => {
  it('creates a provider with a new name', async () => {
    const service = providersWith(repoWith([]));

    await expect(service.create(1, { name: 'Bimbo', phone: '555 123 4567' })).resolves.toMatchObject({
      name: 'Bimbo',
      phone: '555 123 4567',
    });
  });

  it('refuses a name another provider has, even a deleted one', async () => {
    const service = providersWith(repoWith([{ id: 1, name: 'Bimbo', deletedAt: new Date() }]));

    await expect(service.create(1, { name: 'Bimbo' })).rejects.toThrow(BadRequestException);
  });

  it('lets a provider keep its own name when other fields change', async () => {
    const service = providersWith(repoWith([{ id: 1, name: 'Bimbo' }]));

    await expect(service.update(1, 1, { name: 'Bimbo', contactName: 'Ana' })).resolves.toMatchObject({
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

    await expect(service.update(1, 2, { phone: '555 000 0000' })).resolves.toMatchObject({ phone: '555 000 0000' });
  });

  it('refuses renaming a provider to the name of another', async () => {
    const service = providersWith(
      repoWith([
        { id: 1, name: 'Bimbo' },
        { id: 2, name: 'Coca-Cola' },
      ])
    );

    await expect(service.update(1, 2, { name: 'Bimbo' })).rejects.toThrow(BadRequestException);
  });

  it('answers not found for a provider that is not there', async () => {
    const service = providersWith(repoWith([]));

    await expect(service.findOne(1, 9)).rejects.toThrow(NotFoundException);
    await expect(service.remove(1, 9)).rejects.toThrow(NotFoundException);
  });

  it("keeps each store's providers apart: names repeat across stores, and ids do not cross", async () => {
    const service = providersWith(repoWith([{ id: 1, name: 'Bimbo', storeId: 2 }]));

    //Another store already has a Bimbo, this one may too
    await expect(service.create(1, { name: 'Bimbo' })).resolves.toMatchObject({ name: 'Bimbo' });
    await expect(service.findOne(1, 1)).rejects.toThrow(NotFoundException);
    await expect(service.update(1, 1, { phone: '555' })).rejects.toThrow(NotFoundException);
    await expect(service.findOne(2, 1)).resolves.toMatchObject({ name: 'Bimbo' });
  });
});
