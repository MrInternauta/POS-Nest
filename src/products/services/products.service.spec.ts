import { NotFoundException } from '@nestjs/common';

import { LessThanOrEqual, Repository } from 'typeorm';

import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { Provider } from '../entities/provider.entity';
import { CategoriesService } from './categories.service';
import { ProductsService } from './products.service';
import { StoresService } from '../../stores/services/stores.service';
import { ProvidersService } from './providers.service';

const bimbo = { id: 3, name: 'Bimbo' } as Provider;
const pan = { id: 5, name: 'PAN' } as Category;

/** One product in the table, already holding a category and a provider */
const serviceWith = () => {
  const product = { id: 1, name: 'Gansito', category: pan, provider: bimbo } as Product;

  const productRepo = {
    find: jest.fn(async () => []),
    findAndCount: jest.fn(async () => [[], 0]),
    findOne: jest.fn(async () => product),
    create: jest.fn(payload => ({ ...payload })),
    merge: jest.fn((target, changes) => Object.assign(target, changes)),
    save: jest.fn(async entity => entity),
  } as unknown as Repository<Product>;

  const categories = {
    findOne: jest.fn(async (id: number) => {
      if (id !== pan.id) throw new NotFoundException(`Category ${id} not found`);
      return pan;
    }),
  } as unknown as CategoriesService;

  const providers = {
    findOne: jest.fn(async (id: number) => {
      if (id !== bimbo.id) throw new NotFoundException(`Provider ${id} not found`);
      return bimbo;
    }),
  } as unknown as ProvidersService;

  const stores = { mainStore: async () => ({ id: 1 }) } as unknown as StoresService;

  return new ProductsService(productRepo, categories, providers, stores);
};

describe('ProductsService relations', () => {
  it('keeps the category and provider when the changes leave them out', async () => {
    const updated = await serviceWith().update(1, { stock: 4 });

    expect(updated.category).toBe(pan);
    expect(updated.provider).toBe(bimbo);
  });

  it('takes the category and provider off with null', async () => {
    const updated = await serviceWith().update(1, { categoryId: null, providerId: null });

    expect(updated.category).toBeNull();
    expect(updated.provider).toBeNull();
  });

  it('sets the provider on a new product', async () => {
    const created = await serviceWith().create({
      name: 'Nito',
      code: '750100',
      price: 10,
      priceSell: 15,
      stock: 2,
      providerId: bimbo.id,
    });

    expect(created.provider).toBe(bimbo);
  });

  it('answers not found for a provider that is not there instead of a server error', async () => {
    await expect(serviceWith().update(1, { providerId: 99 })).rejects.toThrow(NotFoundException);
  });
});

describe('ProductsService stock filter', () => {
  it('asks for the products with this many units or fewer, the ones that ran out included', async () => {
    const service = serviceWith();

    await service.findAll({ maxStock: 0, limit: 10, offset: 0 });

    const { productRepo } = service as unknown as { productRepo: { findAndCount: jest.Mock } };
    const [{ where }] = productRepo.findAndCount.mock.calls[0];
    expect(where.stock).toEqual(LessThanOrEqual(0));
  });
});
