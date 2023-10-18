import { Controller, Post, Req } from '@nestjs/common';
import { UseGuards } from '@nestjs/common/decorators';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';

import { Request } from 'express';

import { User } from '../../../users/entities/user.entity';
import { LOCAL_STRATEGY } from '../constants/auth';
import { AuthService } from '../services/auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(AuthGuard(LOCAL_STRATEGY))
  @Post('')
  login(@Req() request: Request) {
    const user = request.user as User;
    return this.authService.generateToken(user);
  }
}
