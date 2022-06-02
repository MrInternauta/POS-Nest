import { Injectable } from '@nestjs/common';
import { Product } from 'src/entities/product.entity';

@Injectable()
export class ProductsService {
  private counterId = 1;
  private products: Product[] = [];
  constructor() {
    this.products.push({
      id: 1,
      name: 'Product1',
      description: 'Description 1',
      price: 12,
      stock: 1,
      image: '',
    });

    this.products.push({
      id: 2,
      name: 'Product2',
      description: 'Description 2',
      price: 22,
      stock: 1,
      image: '',
    });
  }
  public findAll() {
    return this.products;
  }

  public findOne(idProduct: number) {
    return this.products.find((product: Product) => product.id === idProduct);
  }
  public create(payload: any) {
    const product: Product = {
      id: this.counterId,
      ...payload,
    };
    this.products.push(product);
    this.counterId++;
    return product;
  }

  public update(id: number, payload: any) {
    const products = this.products.map((product) =>
      product.id === id
        ? {
            id,
            ...product,
            ...payload,
          }
        : product,
    );
    this.products = products;
    return this.findOne(id);
  }

  public delete(id: number) {
    const productsFound = this.products.filter((product) => product.id !== id);
    if (productsFound.length != this.products.length) {
      this.products = productsFound;
      return true;
    }
    return false;
  }
}
