import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class AppController {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  @Get()
  @HttpCode(HttpStatus.NOT_FOUND) // 👈 Using decorator
  getHello(@Res() res: Response) {
    return res.json({ message: 'Not found!' });
  }

  @HttpCode(HttpStatus.ACCEPTED) // 👈 Using decorator
  @Get('new')
  newEndpoint(@Res() res: Response) {
    return res.json({ message: 'new world!' });
  }

  @HttpCode(HttpStatus.ACCEPTED)
  @Get('other')
  otherEnpoint(@Res() res: Response) {
    return res.json({ message: 'other world!' });
  }
}
