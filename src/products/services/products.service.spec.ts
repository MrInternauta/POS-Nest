import { NotFoundException } from '@nestjs/common';

import { Repository } from 'typeorm';

import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { Provider } from '../entities/provider.entity';
import { CategoriesService } from './categories.service';
import { ProductsService } from './products.service';
import { ProvidersService } from './providers.service';

const bimbo = { id: 3, name: 'Bimbo' } as Provider;
const pan = { id: 5, name: 'PAN' } as Category;

/** One product in the table, already holding a category and a provider */
const serviceWith = () => {
  const product = { id: 1, name: 'Gansito', category: pan, provider: bimbo } as Product;

  const productRepo = {
    find: jest.fn(async () => []),
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

  return new ProductsService(productRepo, categories, providers);
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
