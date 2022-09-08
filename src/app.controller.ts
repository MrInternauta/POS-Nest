import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { ApiKeyGuard } from './auth/guards/api-key.guard';
import { Is_Public } from './auth/guards/decorators/public.decorator';

@UseGuards(ApiKeyGuard)
@Controller()
@ApiTags('app')
export class AppController {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(private appService: AppService) {}

  @Get()
  @Is_Public() //@SetMetadata('isPublic', true)
  @HttpCode(HttpStatus.NOT_FOUND)
  getHello() {
    //Don't use @Res() res: Response with Guard
    return { message: 'Not found!' };
  }
  @Get('Hola')
  @Is_Public() //@SetMetadata('isPublic', true)
  @HttpCode(HttpStatus.NOT_FOUND) // 👈 Using decorator
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
