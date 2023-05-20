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
import { CreateCustomerDto } from '../dtos/customer.dto';
import { CreateUserDto, UpdateUserDto } from '../dtos/user.dto';
import { UsersService } from '../services/users.service';

//TODO: Standarize responses
// export interface GenericResponse<T> {
//   statusCode: number;
//   message?: string;
//   error?: string;
//   data?: T;
// }

@Controller('users')
@ApiTags('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @RoleD(Role.ADMIN, Role.CUSTOMER)
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
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return { users: await this.usersService.findAll(page, limit) };
  }

  @Is_PublicD()
  @Get(':userId')
  @ApiOperation({
    summary: 'Get user by Id',
  })
  async get(@Res() res: Response, @Param('userId', ParseIntPipe) id: number) {
    return res.status(HttpStatus.OK).json({
      user: await this.usersService.findOne(id),
    });
  }

  @RoleD(Role.ADMIN)
  @Post('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create just a user',
  })
  async createUser(@Body() payload: CreateUserDto) {
    return {
      message: 'User created',
      user: await this.usersService.create(payload),
    };
  }

  @Is_PublicD()
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create an client',
  })
  async create(@Body() payload: CreateUserDto & CreateCustomerDto) {
    //TODO: Refactor all
    try {
      return {
        message: 'User created',
        user: await this.usersService.createClient(payload),
      };
    } catch (error) {
      return {
        message: 'Error creating',
      };
    }
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @RoleD(Role.ADMIN, Role.CUSTOMER)
  @ApiOperation({
    summary: 'Update an user',
  })
  async update(@Param('id', ParseIntPipe) id: number, @Body() payload: UpdateUserDto) {
    const wasUpdated = await this.usersService.update(id, payload);
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
