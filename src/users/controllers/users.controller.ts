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
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserDto, UpdateUserDto } from '../dtos/user.dto';
import { UsersService } from '../services/users.service';
import { Response } from 'express';
@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('Hola')
  @HttpCode(HttpStatus.NOT_FOUND) // 👈 Using decorator
  async getDBHola(@Res() res: Response) {
    return res.json({ value: await this.usersService.nativeRequest() });
  }

  @Get()
  findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return { users: this.usersService.findAll(page, limit) };
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Post()
  create(@Body() payload: CreateUserDto) {
    return this.usersService.create(payload);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateUserDto,
  ) {
    return this.usersService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.delete(+id);
  }

  @Get(':id/getOrder')
  getOrder(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getOrderByUserId(id);
  }
}
