import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { ProductsService } from '../../products/services/products.service';
// import { Client } from 'pg';
import { CreateUserDto } from '../dtos/user.dto';
// import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { CustomersService } from './customers.service';

@Injectable()
export class UsersService {
  constructor(
    // private configService: ConfigService,
    // @Inject('DB_CONNECTION') private dbClient: Client,
    private productsService: ProductsService,

    private customerService: CustomersService,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  nativeRequest() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({ message: 'Hello World' });
      }, 1000);
      // this.dbClient.query('SELECT * FROM hola', function (error, res) {
      //   if (error) {
      //     reject(error);
      //     return;
      //   }
      //   resolve(res.rows);
      // });
    });
  }

  getConfigEnviroments() {
    console.log('OK');

    // console.log(this.configService.get('API_KEY'));
    // console.log(this.configService.get('DATA_BASE'));
  }

  findAll(page: number, limit: number) {
    const end = page * limit;
    const start = end - limit;
    return this.userRepo.find({
      relations: ['customer'],
    });
  }

  findbyCustomerId(id: number) {
    return this.userRepo.find({
      where: { customer: { id } },
      relations: ['customer'],
    });
  }

  async findOne(id: number) {
    const user = await this.userRepo.findOneBy({
      id,
    });
    if (!user) {
      throw new NotFoundException('User Not found');
    } else {
      return user;
    }
  }

  async findByEmail(email: string) {
    const user = await this.userRepo.findOneBy({
      email,
    });
    if (!user) {
      throw new NotFoundException('User Not found');
    } else {
      return user;
    }
  }

  async create(entity: CreateUserDto) {
    const user = this.userRepo.create(entity);
    const HASHED_PASS = await bcrypt.hash(user.password, 10);
    user.password = HASHED_PASS;

    if (entity.customerId) {
      const customer = await this.customerService.findOne(entity.customerId);
      user.customer = customer;
    }
    this.userRepo.save(user);
    return user;
  }

  async update(id: number, payload: any) {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    } else {
      this.userRepo.merge(user, payload);
      return this.userRepo.save(user);
    }
  }

  async delete(id: number) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    } else {
      return this.userRepo.softDelete({ id });
    }
  }

  async getOrderByUserId(id: number) {
    const user = await this.findOne(id);
    return {
      date: new Date(),
      user,
      products: await this.productsService.findAll(),
    };
  }
}
