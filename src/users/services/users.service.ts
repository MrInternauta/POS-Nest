import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { User } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsService } from '../../products/services/products.service';
import { Client } from 'pg';
@Injectable()
export class UsersService {
  constructor(
    private configService: ConfigService,
    @Inject('DB_CONNECTION') private dbClient: Client,
    private productsService: ProductsService,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  nativeRequest() {
    return new Promise((resolve, reject) => {
      this.dbClient.query('SELECT * FROM hola', function (error, res) {
        if (error) {
          reject(error);
          return;
        }
        resolve(res.rows);
      });
    });
  }
  getConfigEnviroments() {
    console.log(this.configService.get('API_KEY'));
    console.log(this.configService.get('DATA_BASE'));
  }

  findAll(page: number, limit: number) {
    const end = page * limit;
    const start = end - limit;
    return this.userRepo.find();
  }

  findOne(id: number) {
    const user = this.userRepo.findOneBy({
      id,
    });
    if (!user) {
      throw new NotFoundException('User Not found');
    }
    return user;
  }

  create(entity: any) {
    const user = this.userRepo.create(entity);
    this.userRepo.save(user);
    return user;
  }

  async update(id: number, payload: any) {
    const user = await this.findOne(id);
    if (!user) {
      return false;
    }
    this.userRepo.merge(user, payload);
    this.userRepo.save(user);
  }

  async delete(id: number) {
    const user = await this.userRepo.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return this.userRepo.softDelete({ id });
  }

  async getOrderByUserId(id: number) {
    const user = await this.findOne(id);
    return {
      date: new Date(),
      user,
      products: await this.productsService.findAll(1, 10),
    };
  }
}
