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
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { CreateUserDto, UpdateUserDto } from '../dtos/user.dto';
import { UsersService } from '../services/users.service';

@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(private usersService: UsersService) {}
  @ApiOperation({
    summary: 'A static path',
    description:
      'First router with static path.\nEvite hit with parameter path :id',
  })
  @Get('Hola')
  @HttpCode(HttpStatus.OK) // 👈 Using decorator
  async getDBHola(@Res() res: Response) {
    return res.json({ value: await this.usersService.nativeRequest() });
  }

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

  @Get(':userId')
  @ApiOperation({
    summary: 'Get user by Id',
  })
  async get(@Res() res: Response, @Param('userId', ParseIntPipe) id: number) {
    return res.status(HttpStatus.OK).json({
      user: await this.usersService.findOne(id),
    });
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create an user',
  })
  async create(@Body() payload: CreateUserDto) {
    return {
      message: 'User created',
      user: await this.usersService.create(payload),
    };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update an user',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateUserDto,
  ) {
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

  @Get(':id/getOrder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get order',
  })
  async getOrder(@Param('id', ParseIntPipe) id: number) {
    return {
      order: await this.usersService.getOrderByUserId(id),
    };
  }
}
