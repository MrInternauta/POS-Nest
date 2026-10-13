import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { Request } from 'express';

import { StoresService } from '../stores/services/stores.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';

const as = (sub: number, storeRole: 'OWNER' | 'CASHIER' | null, superAdmin = false) =>
  ({ user: { sub, storeId: 3, storeRole, superAdmin } } as unknown as Request);
const file = { originalname: 'a.png' } as Express.Multer.File;

/** The membership is read from the database again, here it answers with the role the token says */
const controllerWith = () => {
  const appService = {
    updateImgeProduct: jest.fn(async () => ({ id: 1 })),
    updateImgeUser: jest.fn(async () => ({ id: 1 })),
  };
  const storesService = {
    resolveAccess: jest.fn(async user => ({ store: { id: user.storeId }, role: user.storeRole })),
  };
  return {
    controller: new AppController(appService as unknown as AppService, storesService as unknown as StoresService),
    appService,
  };
};

describe('AppController picture uploads', () => {
  it("lets only the store's owner change a product picture, within that store", async () => {
    const { controller, appService } = controllerWith();

    await expect(controller.uploadFile(as(2, 'CASHIER'), 'product', 10, file)).rejects.toThrow(ForbiddenException);
    await controller.uploadFile(as(1, 'OWNER'), 'product', 10, file);
    await controller.uploadFile(as(9, null, true), 'product', 10, file);

    expect(appService.updateImgeProduct).toHaveBeenCalledTimes(2);
    expect(appService.updateImgeProduct).toHaveBeenCalledWith(3, 10, file);
  });

  it("lets a user change their own picture, and a super admin anyone's", async () => {
    const { controller, appService } = controllerWith();

    await controller.uploadFile(as(2, 'CASHIER'), 'user', 2, file);
    await controller.uploadFile(as(9, null, true), 'user', 2, file);
    await expect(controller.uploadFile(as(3, 'OWNER'), 'user', 2, file)).rejects.toThrow(ForbiddenException);

    expect(appService.updateImgeUser).toHaveBeenCalledTimes(2);
  });

  it('answers not found for any other kind of picture', async () => {
    const { controller } = controllerWith();

    await expect(controller.uploadFile(as(9, null, true), 'logo' as never, 1, file)).rejects.toThrow(NotFoundException);
  });
});
