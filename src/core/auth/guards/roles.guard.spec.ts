import { Controller, ExecutionContext, Get, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RoleD } from '../decorators/roles.decorator';
import { Role } from '../models/roles.model';
import { RolesGuard } from './roles.guard';

@RoleD(Role.ADMIN, Role.CASHIER)
@Controller('shop')
class ShopController {
  @Get()
  list() {
    return [];
  }

  @RoleD(Role.ADMIN)
  @Get('close')
  close() {
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

const contextFor = (controller: object, handler: string, role: string) =>
  ({
    getHandler: () => controller[handler],
    getClass: () => controller.constructor,
    switchToHttp: () => ({ getRequest: () => ({ user: { sub: 1, role } }) }),
  } as unknown as ExecutionContext);

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());
  const shop = new ShopController();

  it('applies the roles a controller sets for all its routes', () => {
    expect(guard.canActivate(contextFor(shop, 'list', 'CASHIER'))).toBe(true);
    expect(() => guard.canActivate(contextFor(shop, 'list', 'CLIENT'))).toThrow(UnauthorizedException);
  });

  it('lets a route narrow the roles of its controller', () => {
    expect(guard.canActivate(contextFor(shop, 'close', 'ADMIN'))).toBe(true);
    expect(() => guard.canActivate(contextFor(shop, 'close', 'CASHIER'))).toThrow(UnauthorizedException);
  });

  it('lets anyone signed in through when nothing sets roles', () => {
    expect(guard.canActivate(contextFor(new OpenController(), 'list', 'CLIENT'))).toBe(true);
  });
});
