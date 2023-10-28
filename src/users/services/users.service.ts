import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { FilterDto } from '../../core/interfaces/filter.dto';
import { UserDto } from '../dtos/user.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  findAll(params: FilterDto) {
    const { limit, offset } = params;
    return this.userRepo.find({
      take: limit,
      skip: offset,
    });
  }

  findOne(id: number) {
    return this.userRepo.findOneBy({
      id,
    });
  }

  async findByEmail(email: string): Promise<User> {
    return this.userRepo.findOneBy({
      email,
    });
  }

  async create(entity: UserDto) {
    const userFound = await this.findByEmail(entity.email);

    if (userFound) throw new BadRequestException('Email in use');

    const userTemp = {
      ...entity,
      role: null,
    };

    const user = this.userRepo.create(userTemp);

    if (!user) {
      throw new InternalServerErrorException('User cannot be crated');
    }

    const HASHED_PASS = await bcrypt.hash(user.password, 10);
    user.password = HASHED_PASS;
    this.userRepo.save(user);
    return user;
  }

  async update(id: number, payload: any) {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('User Not found');
    }
    this.userRepo.merge(user, payload);
    return this.userRepo.save(user);
  }

  async delete(id: number) {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('User Not found');
    }
    return this.userRepo.softDelete({ id });
  }

  async defaultValuesUser() {
    const HASHED_PASS = await bcrypt.hash('1234567890', 10);
    const admin: UserDto = {
      name: 'admin',
      lastName: 'admin',
      phone: '1234567890',
      email: 'admin@admin.com',
      password: HASHED_PASS,
      role: 1,
    };

    const cashier: UserDto = {
      name: 'cashier',
      lastName: 'cashier',
      phone: '1234567890',
      email: 'cashier@cashier.com',
      password: HASHED_PASS,
      role: 2,
    };

    const client: UserDto = {
      name: 'client',
      lastName: 'client',
      phone: '1234567890',
      email: 'client@client.com',
      password: HASHED_PASS,
      role: 3,
    };

    return {
      admin,
      cashier,
      client,
    };
  }
}
