import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { FilterDto } from '../../core/interfaces/filter.dto';
import { UserDto } from '../dtos/user.dto';
import { User } from '../entities/user.entity';
import { RolesService } from './roles.service';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) public userRepo: Repository<User>, private rolesService: RolesService) {}

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

  async findByEmail(email: string, loadRole = false): Promise<User> {
    // loadRelationIds: { relations: ['categories', 'brand'] },

    return !loadRole
      ? this.userRepo.findOneBy({ email })
      : this.userRepo.findOne({ where: { email }, relations: { role: { permissions: true } } });
  }

  async create(entity: UserDto) {
    const userFound = await this.findByEmail(entity.email);

    if (userFound) throw new BadRequestException('Email in use');

    const user = this.userRepo.create({
      ...entity,
      role: null,
    });

    if (entity.role) {
      const role = await this.rolesService.findOne(entity.role);
      user.role = role;
    }

    if (!user) {
      throw new InternalServerErrorException('User cannot be crated');
    }

    const HASHED_PASS = await bcrypt.hash(user.password, 10);
    user.password = HASHED_PASS;
    return this.userRepo.save(user);
  }

  async update(id: number, payload: User | UserDto) {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('User Not found ' + id);
    }

    if (payload instanceof UserDto) {
      const role = await this.rolesService.findOne(payload?.role);
      this.userRepo.merge(user, {
        name: payload.name,
        lastName: payload.lastName,
        phone: payload.phone,
        image: payload?.image,
        role,
      });

      return this.userRepo.save(user);
    }
    if (payload?.role?.id && !isNaN(payload?.role?.id)) {
      const role = await this.rolesService.findOne(payload?.role?.id);
      console.log('role', role);
      this.userRepo.merge(user, {
        name: payload.name,
        lastName: payload.lastName,
        phone: payload.phone,
        image: payload?.image,
        role,
      });
    } else if (payload?.role) {
      console.log('payload', payload);
      this.userRepo.merge(user, {
        name: payload.name,
        lastName: payload.lastName,
        phone: payload.phone,
        image: payload?.image,
        role: payload?.role,
      });
    } else {
      console.log('payload', payload);
      this.userRepo.merge(user, {
        name: payload.name,
        lastName: payload.lastName,
        phone: payload.phone,
        image: payload?.image,
      });
    }

    return this.userRepo.save(user);
  }

  async delete(id: number) {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('User Not found');
    }
    return this.userRepo.softDelete({ id });
  }

  defaultValuesUser() {
    const HASHED_PASS = '1234567890';
    const admin: UserDto = {
      name: 'admin',
      lastName: 'admin',
      phone: '1234567890',
      email: 'admin@admin.com',
      password: HASHED_PASS,
      image: '',
    };

    const cashier: UserDto = {
      name: 'cashier',
      lastName: 'cashier',
      phone: '1234567890',
      email: 'cashier@cashier.com',
      password: HASHED_PASS,
      image: '',
    };

    const client: UserDto = {
      name: 'client',
      lastName: 'client',
      phone: '1234567890',
      email: 'client@client.com',
      password: HASHED_PASS,
      image: '',
    };

    return {
      admin,
      cashier,
      client,
    };
  }
}
