import { Injectable } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common/exceptions';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/services/users.service';
import { PayloadToken } from '../models/token.model';

@Injectable()
export class AuthService {

  constructor(private userService: UsersService, private jwtService: JwtService) {

  }

  async validateUser(userName: string, password: string) {
    const user = await this.userService.findByEmail(userName);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('User or password wrong!');
    }
    return user;
  }

  generateToken(user: User) {
    const payload: PayloadToken = { role: user.role, sub: user.id }
    return {
      access_token: this.jwtService.sign(payload),
      user
    }
  }

}
