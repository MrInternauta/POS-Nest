import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(private appService: AppService) {}

  @Get()
  @HttpCode(HttpStatus.NOT_FOUND) // 👈 Using decorator
  getHello(@Res() res: Response) {
    return res.json({ message: 'Not found!' });
  }
  @Get('Hola')
  @HttpCode(HttpStatus.NOT_FOUND) // 👈 Using decorator
  async getDBHola(@Res() res: Response) {
    return res.json({ value: await this.appService.getValue() });
  }

  @HttpCode(HttpStatus.ACCEPTED) // 👈 Using decorator
  @Get('new')
  newEndpoint(@Res() res: Response) {
    return res.json({ message: 'new world!' });
  }

  @HttpCode(HttpStatus.ACCEPTED) // 👈 Using decorator
  @Get('api_key')
  apiKey(@Res() res: Response) {
    return res.json({ api_key: this.appService.getHello() });
  }

  @HttpCode(HttpStatus.ACCEPTED) // 👈 Using decorator
  @Get('tasks')
  async tasks(@Res() res: Response) {
    return res.json({ tasks: await this.appService.getTasks() });
  }

  @HttpCode(HttpStatus.ACCEPTED)
  @Get('other')
  otherEnpoint(@Res() res: Response) {
    return res.json({ message: 'other world!' });
  }
}
