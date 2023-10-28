import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { RoleD } from '../../core/auth/decorators/roles.decorator';
import { Role } from '../../core/auth/models/roles.model';
import { FilterDto } from '../../core/interfaces/filter.dto';
import { RoleDto } from '../dtos/role.dto';
import { RolesService } from '../services/roles.service';

@Controller('roles')
@ApiTags('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @RoleD(Role.ADMIN)
  @Get()
  @ApiOperation({
    summary: 'roles list',
    description: 'Get roles roles',
    parameters: [
      {
        name: 'page',
        description: 'Page number',
        in: 'query',
        required: false,
      },
      {
        name: 'limit',
        description: 'Limit of roles per page',
        in: 'query',
        required: false,
      },
    ],
  })
  async findAll(@Query() params: FilterDto) {
    return { roles: await this.rolesService.findAllRoles(params) };
  }

  @RoleD(Role.ADMIN)
  @Post('')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create just a Role',
  })
  async createRole(@Body() payload: RoleDto) {
    return {
      message: 'Role created',
      user: await this.rolesService.create(payload),
    };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @RoleD(Role.ADMIN)
  @ApiOperation({
    summary: 'Update an role',
  })
  async update(@Param('id', ParseIntPipe) id: number, @Body() payload: RoleDto) {
    const wasUpdated = await this.rolesService.update(id, payload);
    return {
      message: 'ROLE updated',
      user: wasUpdated,
    };
  }

  @Delete(':id')
  @RoleD(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete an Role',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.rolesService.delete(+id);
    return {
      message: `Role ${id} deleted`,
    };
  }
}
