import { Injectable } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common/exceptions';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../../users/services/users.service';

@Injectable()
export class AuthService {

  constructor(private userService: UsersService) {

  }

  async validateUser(userName: string, password: string) {
    const user = await this.userService.findByEmail(userName);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('User or password wrong!');
    }
    return user;
  }

}
