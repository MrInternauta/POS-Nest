import { Controller, Post, Req } from '@nestjs/common';
import { UseGuards } from '@nestjs/common/decorators';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  @UseGuards(AuthGuard('local'))
  @Post('')
  login(@Req() request: Request) {
    return request.user;
  }
}
