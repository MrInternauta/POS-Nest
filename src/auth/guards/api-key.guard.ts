import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable } from 'rxjs';

import { IS_PUBLIC_KEY } from '../../common/constants/constants';
import { config } from '../../config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private reflector: Reflector, @Inject(config.KEY) private configService: ConfigType<typeof config>) {}
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.get(IS_PUBLIC_KEY, context.getHandler());
    if (isPublic) {
      return true;
    }

    if (context.switchToHttp().getRequest<Request>().header('auth') || '' !== this.configService.api_key) {
      throw new UnauthorizedException('User Unathorized');
    }
    return true;
  }
}
