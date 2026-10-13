import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Request } from 'express';

import { ROLES_KEY } from '../../../core/constants/constants';
import { Role } from '../models/roles.model';
import { PayloadToken } from '../models/token.model';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflectorService: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    //A route's own roles win; without them the controller's apply
    const allowed = this.reflectorService.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!allowed) {
      return true;
    }

    const user = context.switchToHttp().getRequest<Request>().user as PayloadToken;

    //A super admin passes every check, in any store
    if (user?.superAdmin) {
      return true;
    }

    const role = String(user?.storeRole ?? '').toLowerCase();
    if (role && allowed.includes(role as Role)) {
      return true;
    }

    //A 403 and not a 401: the app signs out on a 401, and a missing permission is no reason to
    throw new ForbiddenException('The role doesnt have permission');
  }
}
