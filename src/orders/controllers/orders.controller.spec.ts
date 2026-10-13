import { Request } from 'express';

import { OrderService } from '../services/order.service';
import { OrdersController } from './orders.controller';

const as = (role: string, sub: number) => ({ user: { role, sub } } as unknown as Request);

const controllerWith = () => {
  const orderService = {
    findOne: jest.fn(async id => ({ id })),
    create: jest.fn(async order => ({ id: 1, ...order })),
    addItem: jest.fn(async () => ({ id: 1 })),
    removeItem: jest.fn(async () => ({ id: 1 })),
    remove: jest.fn(async () => ({ affected: 1 })),
  };
  return { controller: new OrdersController(orderService as unknown as OrderService), orderService };
};

describe('OrdersController access', () => {
  it("only looks among the caller's own orders, unless the caller is an admin", async () => {
    const { controller, orderService } = controllerWith();

    await controller.findOne(as('CASHIER', 7), 30);
    await controller.findOne(as('ADMIN', 1), 30);

    expect(orderService.findOne).toHaveBeenNthCalledWith(1, 30, true, 7);
    expect(orderService.findOne).toHaveBeenNthCalledWith(2, 30, true, undefined);
  });

  it('records a sale under whoever makes it, whatever user the body names', async () => {
    const { controller, orderService } = controllerWith();
    const items = [{ productId: 1, quantity: 2 }];

    await controller.create(as('CASHIER', 7), { userId: 99, items });
    await controller.create(as('ADMIN', 1), { userId: 99, items });

    expect(orderService.create).toHaveBeenNthCalledWith(1, { userId: 7, items });
    expect(orderService.create).toHaveBeenNthCalledWith(2, { userId: 99, items });
  });

  it("keeps a non-admin from adding to, removing from or deleting someone else's order", async () => {
    const { controller, orderService } = controllerWith();

    await controller.addItem(as('CLIENT', 5), 30, { productId: 1, quantity: 1 });
    await controller.deleteItem(as('CLIENT', 5), 30, 2);
    await controller.delete(as('CLIENT', 5), 30);

    expect(orderService.addItem).toHaveBeenCalledWith(30, { productId: 1, quantity: 1 }, 5);
    expect(orderService.removeItem).toHaveBeenCalledWith(30, 2, 5);
    expect(orderService.remove).toHaveBeenCalledWith(30, 5);
  });
});
