import { Request } from 'express';

import { Store } from '../../stores/entities/store.entity';
import { OrderService } from '../services/order.service';
import { OrdersController } from './orders.controller';

const store = { id: 3 } as Store;
const as = (storeRole: 'OWNER' | 'CASHIER', sub: number, superAdmin = false) =>
  ({ user: { sub, storeId: store.id, storeRole, superAdmin } } as unknown as Request);

const controllerWith = () => {
  const orderService = {
    findAll: jest.fn(async () => []),
    findOne: jest.fn(async (_store, id) => ({ id })),
    create: jest.fn(async (_store, _seller, order) => ({ id: 1, ...order })),
    addItem: jest.fn(async () => ({ id: 1 })),
    removeItem: jest.fn(async () => ({ id: 1 })),
    remove: jest.fn(async () => ({ affected: 1 })),
  };
  return { controller: new OrdersController(orderService as unknown as OrderService), orderService };
};

describe('OrdersController access', () => {
  it("looks only among a cashier's own sales, and among all the store's for its owner", async () => {
    const { controller, orderService } = controllerWith();

    await controller.findOne(store, as('CASHIER', 7), 30);
    await controller.findOne(store, as('OWNER', 1), 30);
    await controller.findOne(store, as('CASHIER', 1, true), 30);

    expect(orderService.findOne).toHaveBeenNthCalledWith(1, 3, 30, true, 7);
    expect(orderService.findOne).toHaveBeenNthCalledWith(2, 3, 30, true, undefined);
    expect(orderService.findOne).toHaveBeenNthCalledWith(3, 3, 30, true, undefined);
  });

  it('records a sale in the store being worked in, under whoever makes it', async () => {
    const { controller, orderService } = controllerWith();
    const order = { userId: 99, items: [{ productId: 1, quantity: 2 }] };

    await controller.create(store, as('CASHIER', 7), order);

    expect(orderService.create).toHaveBeenCalledWith(3, 7, order);
  });

  it("keeps a cashier from adding to, removing from or deleting someone else's sale", async () => {
    const { controller, orderService } = controllerWith();

    await controller.addItem(store, as('CASHIER', 5), 30, { productId: 1, quantity: 1 });
    await controller.deleteItem(store, as('CASHIER', 5), 30, 2);
    await controller.delete(store, as('CASHIER', 5), 30);

    expect(orderService.addItem).toHaveBeenCalledWith(3, 30, { productId: 1, quantity: 1 }, 5);
    expect(orderService.removeItem).toHaveBeenCalledWith(3, 30, 2, 5);
    expect(orderService.remove).toHaveBeenCalledWith(3, 30, 5);
  });
});
