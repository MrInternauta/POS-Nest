import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateProductDto, UpdateProductDto } from './product.dto';

/** What the global ValidationPipe does: query and body values are converted to the declared types */
const errorsOf = async (dto: typeof CreateProductDto | typeof UpdateProductDto, body: object) => {
  const errors = await validate(plainToInstance(dto, body, { enableImplicitConversion: true }));
  return errors.map(error => error.property);
};

const product = { name: 'Gansito', code: '7501', price: 10, priceSell: 15, stock: 3 };

describe('product stock', () => {
  it('takes 0, a product that ran out', async () => {
    expect(await errorsOf(CreateProductDto, { ...product, stock: 0 })).toEqual([]);
    expect(await errorsOf(UpdateProductDto, { stock: 0 })).toEqual([]);
  });

  it('takes the stock as the app sends it, as text', async () => {
    expect(await errorsOf(UpdateProductDto, { stock: '0' })).toEqual([]);
    expect(await errorsOf(UpdateProductDto, { stock: '12' })).toEqual([]);
  });

  it('refuses a negative or a fractional stock', async () => {
    expect(await errorsOf(UpdateProductDto, { stock: -1 })).toEqual(['stock']);
    expect(await errorsOf(UpdateProductDto, { stock: 1.5 })).toEqual(['stock']);
  });

  it('still needs a stock to create a product', async () => {
    expect(await errorsOf(CreateProductDto, { ...product, stock: undefined })).toEqual(['stock']);
  });
});
