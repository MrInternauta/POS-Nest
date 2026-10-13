import { Body, Controller, HttpCode, HttpStatus, NotFoundException, Post, Req } from '@nestjs/common';
import { UseGuards } from '@nestjs/common/decorators';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Request } from 'express';

import { UsersService } from '../../../users/services/users.service';
import { User } from '../../../users/entities/user.entity';
import { LOCAL_STRATEGY } from '../constants/auth';
import { SwitchStoreDto } from '../dtos/switch-store.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PayloadToken } from '../models/token.model';
import { AuthService } from '../services/auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private usersService: UsersService) {}

  @UseGuards(AuthGuard(LOCAL_STRATEGY))
  @Post('')
  @ApiOperation({
    summary: 'Log in',
    description: 'Answers a token for the first store the user works in, and all of them',
  })
  login(@Req() request: Request) {
    const user = request.user as User;
    return this.authService.generateToken(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('switch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Work in another store', description: 'A new token for a store the user belongs to' })
  async switchStore(@Req() request: Request, @Body() body: SwitchStoreDto) {
    const caller = request.user as PayloadToken;
    const user = await this.usersService.findOne(caller.sub);
    if (!user || !user.active) {
      throw new NotFoundException('User not found');
    }
    return this.authService.generateToken(user, body.storeId);
  }
}
