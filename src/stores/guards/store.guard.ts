import { CanActivate, createParamDecorator, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Request } from 'express';

import { IS_PUBLIC_KEY } from '../../core/constants/constants';
import { PayloadToken } from '../../core/auth/models/token.model';
import { Store } from '../entities/store.entity';
import { StoresService } from '../services/stores.service';

/**
 * Lets a request into a store's data only when the user really belongs to the store named in
 * their token, or is a super admin, and the store is switched on. The role is read again from the
 * membership, so a change or a removal counts right away, not when the token expires. Goes after
 * JwtAuthGuard and before RolesGuard.
 */
@Injectable()
export class StoreGuard implements CanActivate {
  constructor(private reflector: Reflector, private storesService: StoresService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { store?: Store }>();
    const user = request.user as PayloadToken;
    const { store, role } = await this.storesService.resolveAccess(user);

    request.store = store;
    request.user = { ...user, storeRole: role };
    return true;
  }
}

/** The store the request works in, as StoreGuard found it */
export const CurrentStore = createParamDecorator((_data: unknown, context: ExecutionContext): Store => {
  const store = context.switchToHttp().getRequest<{ store?: Store }>().store;
  if (!store) {
    //Only reachable when a controller forgot StoreGuard, which is a bug, not a user error
    throw new Error('CurrentStore used on a route without StoreGuard');
  }
  return store;
});
