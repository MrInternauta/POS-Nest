import { IService } from 'src/common/interfaces/service.interface';

import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { User } from '../entities/user.entity';

@Injectable()
export class UsersService implements IService {
  users: User[] = [];
  counterId: number;

  constructor(private configService: ConfigService) {
    this.counterId = this.users.length || 0;
    console.log('Start users');
  }

  findAll(page: number, limit: number) {
    console.log(this.configService.get('API_KEY'));
    console.log(this.configService.get('DATA_BASE'));

    const end = page * limit;
    const start = end - limit;
    return this.users.slice(start, end);
  }

  findOne(id: number) {
    const user = this.users.find((user: User) => user.id === id);
    if (!user) {
      throw new NotFoundException('User Not found');
    }
    return user;
  }

  create(entity: any) {
    const user: any = {
      id: this.counterId,
      ...entity,
    };
    this.users.push(user);
    this.counterId++;
    return user;
  }

  update(id: number, payload: any) {
    let user = this.findOne(id);
    if (!user) {
      return false;
    }
    user = {
      id,
      ...user,
      ...payload,
    };
    const users = this.users.map((userItem) =>
      userItem.id === id ? user : userItem,
    );

    this.users = users;
  }

  delete(id: number): boolean {
    const usersFound = this.users.filter((user) => user.id !== id);
    if (usersFound.length != this.users.length) {
      this.users = usersFound;
      return true;
    }
    return false;
  }

  getOrderByUserId(id: number) {
    const user = this.findOne(id);
    return {
      date: new Date(),
      user,
      products: this.findAll(1, 10),
    };
  }
}
