import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { Request } from 'express';

import { AppController } from './app.controller';
import { AppService } from './app.service';

const as = (role: string, sub: number) => ({ user: { role, sub } } as unknown as Request);
const file = { originalname: 'a.png' } as Express.Multer.File;

const controllerWith = () => {
  const appService = {
    updateImgeProduct: jest.fn(async () => ({ id: 1 })),
    updateImgeUser: jest.fn(async () => ({ id: 1 })),
  };
  return { controller: new AppController(appService as unknown as AppService), appService };
};

describe('AppController picture uploads', () => {
  it('lets only an admin change a product picture', async () => {
    const { controller, appService } = controllerWith();

    expect(() => controller.uploadFile(as('CASHIER', 2), 'product', 10, file)).toThrow(ForbiddenException);
    await controller.uploadFile(as('ADMIN', 1), 'product', 10, file);

    expect(appService.updateImgeProduct).toHaveBeenCalledTimes(1);
  });

  it('lets a user change their own picture, and an admin anyone’s', async () => {
    const { controller, appService } = controllerWith();

    await controller.uploadFile(as('CASHIER', 2), 'user', 2, file);
    await controller.uploadFile(as('ADMIN', 1), 'user', 2, file);
    expect(() => controller.uploadFile(as('CLIENT', 3), 'user', 2, file)).toThrow(ForbiddenException);

    expect(appService.updateImgeUser).toHaveBeenCalledTimes(2);
  });

  it('answers not found for any other kind of picture', () => {
    const { controller } = controllerWith();

    expect(() => controller.uploadFile(as('ADMIN', 1), 'logo' as never, 1, file)).toThrow(NotFoundException);
  });
});
