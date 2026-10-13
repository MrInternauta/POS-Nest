import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';

import { FilterDto } from '../../core/interfaces/filter.dto';
import { UserDto } from '../dtos/user.dto';
import { User } from '../entities/user.entity';
import { RolesService } from './roles.service';

/** Role given to a user that signs up without asking for one */
const DEFAULT_ROLE_NAME = 'CLIENT';

/** What a profile update may change */
const USER_FIELDS = ['name', 'lastName', 'phone', 'image'] as const;
export type UserChanges = Partial<Pick<UserDto, (typeof USER_FIELDS)[number]>>;

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
    } else {
      //Signing up sends no role, and a user without one is turned away by every guarded route
      user.role = await this.rolesService.findOneByName(DEFAULT_ROLE_NAME);
    }

    if (!user) {
      throw new InternalServerErrorException('User cannot be crated');
    }

    const HASHED_PASS = await bcrypt.hash(user.password, 10);
    user.password = HASHED_PASS;
    return this.userRepo.save(user);
  }

  /** Super admins see every store; only the seed and the migration make one */
  async setSuperAdmin(id: number, isSuperAdmin: boolean) {
    await this.userRepo.update({ id }, { isSuperAdmin });
  }

  /**
   * Changes what a profile shows. The role changes only when `roleId` is given, and deciding who
   * may ask for that is the caller's job: the controller only passes it on for an admin.
   */
  async update(id: number, changes: UserChanges, roleId?: number) {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('User Not found ' + id);
    }

    //Only these fields, and only the ones sent: an email, a password or a role in the body is ignored
    for (const field of USER_FIELDS) {
      if (changes?.[field] !== undefined) {
        user[field] = changes[field];
      }
    }

    if (roleId !== undefined && roleId !== null) {
      const role = await this.rolesService.findOne(roleId);
      if (!role) {
        throw new BadRequestException(`Role ${roleId} not found`);
      }
      user.role = role;
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
