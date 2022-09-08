import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AppService } from './app.service';
import { ApiKeyGuard } from './auth/guards/api-key.guard';

@Controller()
@ApiTags('app')
export class AppController {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(private appService: AppService) {}

  @Get()
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.NOT_FOUND)
  getHello() {
    //Don't use @Res() res: Response with Guard
    return { message: 'Not found!' };
  }
  @Get('Hola')
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.NOT_FOUND) // 👈 Using decorator
  async getDBHola() {
    return { value: await this.appService.getValue() };
  }

  @HttpCode(HttpStatus.ACCEPTED) // 👈 Using decorator
  @Get('new')
  @UseGuards(ApiKeyGuard)
  newEndpoint() {
    return { message: 'new world!' };
  }

  @HttpCode(HttpStatus.ACCEPTED) // 👈 Using decorator
  @Get('api_key')
  apiKey() {
    return { api_key: this.appService.getHello() };
  }

  @HttpCode(HttpStatus.ACCEPTED) // 👈 Using decorator
  @Get('tasks')
  async tasks() {
    return { tasks: await this.appService.getTasks() };
  }

  @HttpCode(HttpStatus.ACCEPTED)
  @Get('other')
  otherEnpoint() {
    return { message: 'other world!' };
  }
}
