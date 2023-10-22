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
}
