import {
  BadRequestException,
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
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Response } from 'express';

import { Is_PublicD } from '../../core/auth/decorators/public.decorator';
import { RoleD } from '../../core/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Role } from '../../core/auth/models/roles.model';
import { FilterDto } from '../../core/interfaces/filter.dto';
import { UserDto } from '../dtos/user.dto';
import { UsersService } from '../services/users.service';
import { UpdateUserDto } from '../dtos/update-user.dto';

@Controller('users')
@ApiTags('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @RoleD(Role.ADMIN)
  @Get()
  @ApiOperation({
    summary: 'User list',
    description: 'Get all users',
    parameters: [
      {
        name: 'page',
        description: 'Page number',
        in: 'query',
        required: false,
      },
      {
        name: 'limit',
        description: 'Limit of users per page',
        in: 'query',
        required: false,
      },
    ],
  })
  async findAll(@Query() params: FilterDto) {
    return { users: await this.usersService.findAll(params) };
  }

  @Is_PublicD()
  @Get(':userId')
  @ApiOperation({
    summary: 'Get user by Id',
  })
  async get(@Res() res: Response, @Param('userId', ParseIntPipe) id: number) {
    res.status(HttpStatus.OK).json({
      user: await this.usersService.findOne(id),
    });
  }

  @Is_PublicD()
  @Post('')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create just a user',
  })
  async createUser(@Body() payload: UserDto) {
    return {
      message: 'User created',
      user: await this.usersService.create(payload),
    };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @RoleD(Role.ADMIN, Role.CUSTOMER)
  @ApiOperation({
    summary: 'Update an user',
  })
  async update(@Param('id', ParseIntPipe) id: number, @Body() payload: UpdateUserDto) {
    const wasUpdated = await this.usersService.update(id, payload as UserDto);
    if (!wasUpdated) {
      throw new BadRequestException('User not updated');
    }
    return {
      message: 'User updated',
      user: wasUpdated,
    };
  }

  @Delete(':id')
  @RoleD(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete an user',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.delete(+id);
    return {
      message: `User ${id} deleted`,
    };
  }
}
