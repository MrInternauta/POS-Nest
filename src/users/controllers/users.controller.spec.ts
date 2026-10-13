import { ForbiddenException } from '@nestjs/common';

import { Request } from 'express';

import { UserDto } from '../dtos/user.dto';
import { UsersService } from '../services/users.service';
import { UsersController } from './users.controller';

const as = (role: string, sub: number) => ({ user: { role, sub } } as unknown as Request);

const controllerWith = () => {
  const usersService = {
    create: jest.fn(async payload => ({ id: 9, ...payload })),
    findOne: jest.fn(async id => ({ id, name: 'Someone' })),
    update: jest.fn(async (id, changes) => ({ id, ...changes })),
  };
  return { controller: new UsersController(usersService as unknown as UsersService), usersService };
};

describe('UsersController access', () => {
  it('signs up with the default role whatever the body asks for', async () => {
    const { controller, usersService } = controllerWith();

    await controller.createUser({ name: 'Eve', email: 'eve@example.com', password: 'x', role: 1 } as UserDto);

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'eve@example.com', role: undefined })
    );
  });

  it("lets a user read their own profile and an admin anyone's, nobody else", async () => {
    const { controller } = controllerWith();

    await expect(controller.get(as('CASHIER', 4), 4)).resolves.toEqual({ user: { id: 4, name: 'Someone' } });
    await expect(controller.get(as('ADMIN', 1), 4)).resolves.toBeDefined();
    await expect(controller.get(as('CLIENT', 5), 4)).rejects.toThrow(ForbiddenException);
  });

  it('refuses to update someone else unless the caller is an admin', async () => {
    const { controller, usersService } = controllerWith();

    await expect(controller.update(as('CLIENT', 5), 4, { name: 'Hacked' })).rejects.toThrow(ForbiddenException);
    expect(usersService.update).not.toHaveBeenCalled();
  });

  it('ignores the role a non-admin sends along with their own profile', async () => {
    const { controller, usersService } = controllerWith();

    await controller.update(as('CLIENT', 5), 5, { name: 'Eve', role: 1 });
    await controller.update(as('CASHIER', 6), 6, { name: 'Bob', role: { id: 1 } as never });

    expect(usersService.update).toHaveBeenNthCalledWith(1, 5, expect.objectContaining({ name: 'Eve' }), undefined);
    expect(usersService.update).toHaveBeenNthCalledWith(2, 6, expect.objectContaining({ name: 'Bob' }), undefined);
  });

  it('lets an admin change a role, sent as an id or as the role itself', async () => {
    const { controller, usersService } = controllerWith();

    await controller.update(as('ADMIN', 1), 4, { role: 2 });
    await controller.update(as('ADMIN', 1), 4, { role: { id: 3 } as never });

    expect(usersService.update).toHaveBeenNthCalledWith(1, 4, expect.anything(), 2);
    expect(usersService.update).toHaveBeenNthCalledWith(2, 4, expect.anything(), 3);
  });
});
