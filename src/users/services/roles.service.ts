import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { FilterDto } from '../../core/interfaces/filter.dto';
import { PermissionDto, RoleDto } from '../dtos/role.dto';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) public roleRepo: Repository<Role>,
    @InjectRepository(Permission) private permissionRepo: Repository<Permission>
  ) {}

  findAllRoles(params?: FilterDto) {
    const { limit, offset } = params;
    return this.roleRepo.find({
      take: limit,
      skip: offset,
      relations: ['permissions'],
    });
  }

  async create(params: RoleDto) {
    const { name, permissions } = params;
    if (!permissions?.length) {
      throw new BadRequestException('Error creating role, add permissions');
    }
    try {
      const roleTemp = await this.findOneByName(name);
      if (roleTemp) {
        throw new BadRequestException('Error creating role, already exists');
      }
      const role = this.roleRepo.create({
        name,
      });

      if (!role) {
        throw new InternalServerErrorException('Role cannot be crated');
      }

      await this.validatePermissions(permissions);
      const newPermission = await this.createPermissions(permissions);
      const allResult = await Promise.all(newPermission);
      role.permissions = allResult;
      return this.roleRepo.save(role);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Error creating role');
    }
  }

  async update(roleId: number, params: RoleDto) {
    try {
      const role = await this.findOne(roleId);
      if (!role) {
        throw new NotFoundException('Role Not found');
      }

      const { name, permissions } = params;
      await this.validatePermissions(permissions);
      const newPermission = await this.updatePermissions(permissions);
      this.roleRepo.merge(role, { ...role, name, permissions: newPermission });
      return this.roleRepo.save(role);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Error updating role');
    }
  }

  validatePermissions(permissions: PermissionDto[]) {
    return new Promise((res, rej) => {
      for (let index = 0; index < permissions.length; index++) {
        if (!permissions[index].name) {
          rej();
        }
      }
      res(true);
    });
  }

  createPermissions(permissions: PermissionDto[]): Array<Promise<Permission>> {
    const newPermissions: Promise<Permission>[] = [];
    for (let index = 0; index < permissions.length; index++) {
      const newPermission = this.createPermission({
        name: permissions[index]?.name,
        description: permissions[index]?.description || null,
      });
      newPermissions.push(newPermission);
    }
    return newPermissions;
  }

  updatePermissions(permissions: PermissionDto[]): Promise<Array<Permission>> {
    return new Promise(async res => {
      const newPermissions: Permission[] = [];
      for (let index = 0; index < permissions.length; index++) {
        const newPermission = await this.updatePermission(permissions[index]);
        newPermissions.push(newPermission);
      }
      res(newPermissions);
    });
  }

  findOneByName(name: string) {
    return this.roleRepo.findOneBy({
      name,
    });
  }

  findOne(id: number) {
    return this.roleRepo.findOneBy({
      id,
    });
  }

  async createPermission(permission: PermissionDto) {
    const currentPermission = await this.permissionRepo.findOneBy({ name: permission.name });
    if (currentPermission?.id) {
      return currentPermission;
    }
    return this.permissionRepo.create(permission);
  }

  async updatePermission(permission: PermissionDto) {
    const currentPermission = await this.permissionRepo.findOneBy({ id: permission.id });
    if (!currentPermission) {
      throw new NotFoundException('Role Not found');
    }
    this.permissionRepo.merge(currentPermission, permission);
    return this.permissionRepo.save(currentPermission);
  }

  async delete(id: number) {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('Role Not found');
    }
    return this.permissionRepo.softDelete({ id });
  }

  defaultValuesRole() {
    const role_admin: RoleDto = {
      name: 'ADMIN',
      permissions: [
        {
          name: 'Users',
          description: '',
        },
      ],
    };

    const role_cashier: RoleDto = {
      name: 'CASHIER',
      permissions: [
        {
          name: 'Orders',
          description: '',
        },
      ],
    };

    const role_client: RoleDto = {
      name: 'CLIENT',
      permissions: [
        {
          name: 'Products',
          description: '',
        },
      ],
    };
    return {
      role_admin,
      role_cashier,
      role_client,
    };
  }
}
