import { Controller, ExecutionContext, ForbiddenException, Get } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RoleD } from '../decorators/roles.decorator';
import { Role } from '../models/roles.model';
import { PayloadToken } from '../models/token.model';
import { RolesGuard } from './roles.guard';

@RoleD(Role.OWNER, Role.CASHIER)
@Controller('shop')
class ShopController {
  @Get()
  list() {
    return [];
  }

  @RoleD(Role.OWNER)
  @Get('close')
  close() {
    return true;
  }

  @RoleD(Role.SUPER_ADMIN)
  @Get('platform')
  platform() {
    return true;
  }
}

@Controller('open')
class OpenController {
  @Get()
  list() {
    return [];
  }
}

const token = (changes: Partial<PayloadToken>): PayloadToken => ({
  sub: 1,
  storeId: 1,
  storeRole: null,
  superAdmin: false,
  ...changes,
});

const contextFor = (controller: object, handler: string, user: PayloadToken) =>
  ({
    getHandler: () => controller[handler],
    getClass: () => controller.constructor,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext);

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());
  const shop = new ShopController();
  const cashier = token({ storeRole: 'CASHIER' });
  const owner = token({ storeRole: 'OWNER' });

  it('applies the roles a controller sets for all its routes', () => {
    expect(guard.canActivate(contextFor(shop, 'list', cashier))).toBe(true);
    expect(() => guard.canActivate(contextFor(shop, 'list', token({ storeRole: null })))).toThrow(ForbiddenException);
  });

  it('lets a route narrow the roles of its controller', () => {
    expect(guard.canActivate(contextFor(shop, 'close', owner))).toBe(true);
    expect(() => guard.canActivate(contextFor(shop, 'close', cashier))).toThrow(ForbiddenException);
  });

  it('lets a super admin through every check, and nobody else through a super admin one', () => {
    expect(guard.canActivate(contextFor(shop, 'close', token({ superAdmin: true })))).toBe(true);
    expect(guard.canActivate(contextFor(shop, 'platform', token({ superAdmin: true })))).toBe(true);
    expect(() => guard.canActivate(contextFor(shop, 'platform', owner))).toThrow(ForbiddenException);
  });

  it('lets anyone signed in through when nothing sets roles', () => {
    expect(guard.canActivate(contextFor(new OpenController(), 'list', token({})))).toBe(true);
  });
});
