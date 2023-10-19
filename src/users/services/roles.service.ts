import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { PermissionDto, RoleDto } from '../dtos/role.dto';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(Permission) private permissionRepo: Repository<Permission>
  ) {}

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
      role.permissions = newPermission;
      this.roleRepo.save(role);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Error creating role');
    }
  }

  validatePermissions(permissions: PermissionDto[]) {
    return new Promise((res, rej) => {
      for (let index = 0; index < permissions.length; index++) {
        if (!permissions[index].name) {
          rej();
        }

        const permission = this.permissionRepo.findOneBy({ name: permissions[index].name });
        if (permission) {
          rej();
        }
      }
      res(true);
    });
  }

  createPermissions(permissions: PermissionDto[]): Promise<Array<Permission>> {
    return new Promise(res => {
      const newPermissions: Permission[] = [];
      for (let index = 0; index < permissions.length; index++) {
        const newPermission = this.createPermission({
          name: permissions[index]?.name,
          description: permissions[index]?.description || null,
        });
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

  createPermission(permission: PermissionDto) {
    return this.permissionRepo.create(permission);
  }
}
