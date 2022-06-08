import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateProductDto,
  UpdateProductDto,
} from 'src/products/dtos/product.dto';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductsService {
  private counterId = 1;
  private products: Product[] = [
    {
      id: 1,
      name: 'Product1',
      description: 'Description 1',
      price: 12,
      stock: 1,
      image: '',
    },
    {
      id: 2,
      name: 'Product2',
      description: 'Description 2',
      price: 22,
      stock: 1,
      image: '',
    },
    {
      id: 3,
      name: 'Product1',
      description: 'Description 1',
      price: 12,
      stock: 1,
      image: '',
    },
    {
      id: 4,
      name: 'Product2',
      description: 'Description 2',
      price: 22,
      stock: 1,
      image: '',
    },
    {
      id: 5,
      name: 'Product2',
      description: 'Description 2',
      price: 22,
      stock: 1,
      image: '',
    },
    {
      id: 6,
      name: 'Product2',
      description: 'Description 2',
      price: 22,
      stock: 1,
      image: '',
    },
    {
      id: 7,
      name: 'Product2',
      description: 'Description 2',
      price: 22,
      stock: 1,
      image: '',
    },
    {
      id: 8,
      name: 'Product2',
      description: 'Description 2',
      price: 22,
      stock: 1,
      image: '',
    },
    {
      id: 9,
      name: 'Product2',
      description: 'Description 2',
      price: 22,
      stock: 1,
      image: '',
    },
    {
      id: 10,
      name: 'Product2',
      description: 'Description 2',
      price: 22,
      stock: 1,
      image: '',
    },
    {
      id: 11,
      name: 'Product2',
      description: 'Description 2',
      price: 22,
      stock: 1,
      image: '',
    },
    {
      id: 12,
      name: 'Product2',
      description: 'Description 2',
      price: 22,
      stock: 1,
      image: '',
    },
    {
      id: 13,
      name: 'Product2',
      description: 'Description 2',
      price: 22,
      stock: 1,
      image: '',
    },
  ];
  constructor() {
    console.log('Start service');
  }
  public findAll(page: number, limit: number) {
    const end = page * limit;
    const start = end - limit;
    return this.products.slice(start, end);
  }

  public findOne(idProduct: number) {
    const product = this.products.find(
      (product: Product) => product.id === idProduct,
    );
    if (!product) {
      throw new NotFoundException('Not found product');
    }
    return product;
  }
  public create(payload: CreateProductDto) {
    const product: Product = {
      id: this.counterId,
      ...payload,
    };
    this.products.push(product);
    this.counterId++;
    return product;
  }

  public update(id: number, payload: UpdateProductDto) {
    let product = this.findOne(id);
    if (!product) {
      return false;
    }

    product = {
      id,
      ...product,
      ...payload,
    };

    const products = this.products.map((productItem) =>
      productItem.id === id ? product : productItem,
    );

    this.products = products;
    return product;
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
