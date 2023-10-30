import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { ApiKeyGuard } from '@project/auth';

import { AppService } from './app.service';

@Controller()
@ApiTags('app')
export class AppController {
  constructor(private appService: AppService) {}
  // @Is_PublicD()
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK) // 👈 Using decorator
  @Get('setDefaultValues')
  @ApiOperation({
    summary: 'Set values by default',
    description: 'set roles, users, categories and products',
    parameters: [
      {
        name: 'auth',
        description: 'Api key',
        in: 'header',
        required: true,
      },
    ],
  })
  async tasks() {
    return await this.appService.setDefaultValues();
  }
}
