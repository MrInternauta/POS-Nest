import { ForbiddenException } from '@nestjs/common';

import { Request } from 'express';

import { UserDto } from '../dtos/user.dto';
import { UsersService } from '../services/users.service';
import { UsersController } from './users.controller';

const as = (sub: number, superAdmin = false) =>
  ({ user: { sub, storeId: 1, storeRole: 'OWNER', superAdmin } } as unknown as Request);

const controllerWith = () => {
  const usersService = {
    create: jest.fn(async payload => ({ id: 9, ...payload })),
    findOne: jest.fn(async id => ({ id, name: 'Someone' })),
    update: jest.fn(async (id, changes) => ({ id, ...changes })),
  };
  return { controller: new UsersController(usersService as unknown as UsersService), usersService };
};

describe('UsersController access', () => {
  it('signs up without a role whatever the body asks for', async () => {
    const { controller, usersService } = controllerWith();

    await controller.createUser({ name: 'Eve', email: 'eve@example.com', password: 'x', role: 1 } as UserDto);

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'eve@example.com', role: undefined })
    );
  });

  it("lets a user read their own profile and a super admin anyone's; a store owner is not enough", async () => {
    const { controller } = controllerWith();

    await expect(controller.get(as(4), 4)).resolves.toEqual({ user: { id: 4, name: 'Someone' } });
    await expect(controller.get(as(1, true), 4)).resolves.toBeDefined();
    await expect(controller.get(as(5), 4)).rejects.toThrow(ForbiddenException);
  });

  it('refuses to update someone else unless the caller is a super admin', async () => {
    const { controller, usersService } = controllerWith();

    await expect(controller.update(as(5), 4, { name: 'Hacked' })).rejects.toThrow(ForbiddenException);
    expect(usersService.update).not.toHaveBeenCalled();
  });

  it('ignores the role anyone but a super admin sends along with their own profile', async () => {
    const { controller, usersService } = controllerWith();

    await controller.update(as(5), 5, { name: 'Eve', role: 1 });
    await controller.update(as(6), 6, { name: 'Bob', role: { id: 1 } as never });

    expect(usersService.update).toHaveBeenNthCalledWith(1, 5, expect.objectContaining({ name: 'Eve' }), undefined);
    expect(usersService.update).toHaveBeenNthCalledWith(2, 6, expect.objectContaining({ name: 'Bob' }), undefined);
  });

  it('lets a super admin change a role, sent as an id or as the role itself', async () => {
    const { controller, usersService } = controllerWith();

    await controller.update(as(1, true), 4, { role: 2 });
    await controller.update(as(1, true), 4, { role: { id: 3 } as never });

    expect(usersService.update).toHaveBeenNthCalledWith(1, 4, expect.anything(), 2);
    expect(usersService.update).toHaveBeenNthCalledWith(2, 4, expect.anything(), 3);
  });
});
