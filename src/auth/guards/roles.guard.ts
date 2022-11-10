import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable } from 'rxjs';

import { ROLES_KEY } from '../../common/constants/constants';
import { Role } from '../models/roles.model';
import { PayloadToken } from '../models/token.model';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflectorService: Reflector) {
  }
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const roles_allowed: Role[] = this.reflectorService.get<Role[]>(ROLES_KEY, context.getHandler());
    console.log('roles_allowed', roles_allowed);

    //Allow because doesnt have a role config
    if (!roles_allowed) {
      return true;
    }
    const req: Request = context.switchToHttp().getRequest();
    const user = req.user as PayloadToken;
    const haveRol = roles_allowed.some((rol) => rol === user.role);
    if (!haveRol) {
      throw new UnauthorizedException('The role doesnt have permission');
    }

    return haveRol;
  }
}
