import { Controller, Get, HttpCode, HttpStatus, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Is_PublicD } from '../core/auth/decorators/public.decorator';
import { RoleD } from '../core/auth/decorators/roles.decorator';
import { ApiKeyGuard } from '../core/auth/guards/api-key.guard';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/auth/guards/roles.guard';
import { Role } from '../core/auth/models/roles.model';
import { AppService } from './app.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
@ApiTags('app')
export class AppController {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(private appService: AppService) {}

  @Get()
  @SetMetadata('isPublic', true)
  @HttpCode(HttpStatus.OK)
  getHello() {
    //Don't use @Res() res: Response with Guard
    return { message: 'Not found!' };
  }
  @Get('Hola')
  @Is_PublicD() //@SetMetadata('isPublic', true)
  @HttpCode(HttpStatus.OK) // 👈 Using decorator
  async getDBHola() {
    return { value: await this.appService.getValue() };
  }

  @HttpCode(HttpStatus.ACCEPTED) // 👈 Using decorator
  @Get('new')
  newEndpoint() {
    return { message: 'new world!' };
  }

  @HttpCode(HttpStatus.ACCEPTED) // 👈 Using decorator
  @Get('api_key')
  apiKey() {
    return { api_key: this.appService.getHello() };
  }

  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.ACCEPTED) // 👈 Using decorator
  @Get('tasks')
  async tasks() {
    return { tasks: await this.appService.getTasks() };
  }

  @RoleD(Role.ADMIN, Role.CUSTOMER)
  @HttpCode(HttpStatus.ACCEPTED)
  @Get('other')
  otherEnpoint() {
    return { message: 'other world!' };
  }
}
