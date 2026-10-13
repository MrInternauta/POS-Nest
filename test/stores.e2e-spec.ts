import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/setup';
import { Customer } from '../src/stores/entities/customer.entity';
import { StoreMember } from '../src/stores/entities/store-member.entity';
import { Store } from '../src/stores/entities/store.entity';
import { StoresService } from '../src/stores/services/stores.service';
import { UsersService } from '../src/users/services/users.service';

/**
 * Two stores in one database, and every way one could reach into the other. Runs against a real,
 * migrated Postgres (DATABASE_URL): the point is the SQL each route ends up running.
 */
const describeWithDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeWithDatabase('Stores are kept apart (e2e)', () => {
  let app: INestApplication;
  let db: DataSource;
  //Every run makes its own users and stores, so it can run again on the same database
  const run = Date.now().toString(36);
  //Made per run, like the users: nothing that reads as a password lives in the code
  const password = `pw-${run}-${Math.random().toString(36).slice(2)}`;

  const ids = {} as Record<string, number>;
  const tokens = {} as Record<string, string>;

  const api = () => request(app.getHttpServer());
  const as = (who: string) => ({ Authorization: `Bearer ${tokens[who]}` });

  const login = async (email: string, storeId?: number) => {
    const response = await api().post('/api/auth').send({ email, password }).expect(201);
    if (storeId === undefined || response.body.store?.id === storeId) return response.body.access_token as string;
    const switched = await api()
      .post('/api/auth/switch')
      .set({ Authorization: `Bearer ${response.body.access_token}` })
      .send({ storeId })
      .expect(200);
    return switched.body.access_token as string;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    db = app.get(DataSource);
    const users = app.get(UsersService);
    const stores = app.get(StoresService);

    for (const name of ['A', 'B']) {
      const store = await db
        .getRepository(Store)
        .save({ name: `Store ${name} ${run}`, slug: `store-${name}-${run}`.toLowerCase() });
      await db.getRepository(Customer).save({ name: 'Público en general', isDefault: true, store });
      ids[`store${name}`] = store.id;
    }

    const user = async (key: string, storeKey?: string, role?: 'OWNER' | 'CASHIER') => {
      const created = await users.create({
        name: key,
        lastName: run,
        phone: '5512345678',
        image: '',
        email: `${key}-${run}@example.com`,
        password,
      });
      ids[key] = created.id;
      if (storeKey) await stores.addMember(ids[storeKey], created.id, role);
    };
    await user('ownerA', 'storeA', 'OWNER');
    await user('cashierA', 'storeA', 'CASHIER');
    await user('ownerB', 'storeB', 'OWNER');
    await user('superAdmin');
    await users.setSuperAdmin(ids.superAdmin, true);
    await user('stranger');

    tokens.ownerA = await login(`ownerA-${run}@example.com`, ids.storeA);
    tokens.cashierA = await login(`cashierA-${run}@example.com`, ids.storeA);
    tokens.ownerB = await login(`ownerB-${run}@example.com`, ids.storeB);
    tokens.stranger = await login(`stranger-${run}@example.com`);

    //The same code and the same names in both stores: each store's own
    for (const [owner, store] of [
      ['ownerA', 'A'],
      ['ownerB', 'B'],
    ]) {
      const category = await api().post('/api/categories').set(as(owner)).send({ name: 'LACTEOS' }).expect(200);
      ids[`category${store}`] = category.body.product.id;
      const provider = await api().post('/api/providers').set(as(owner)).send({ name: 'Lala' }).expect(200);
      ids[`provider${store}`] = provider.body.provider.id;
      const product = await api()
        .post('/api/products')
        .set(as(owner))
        .send({ name: `Leche ${store}`, code: `SAME-${run}`, price: 20, priceSell: 28, stock: 10 })
        .expect(200);
      ids[`product${store}`] = product.body.product.id;
    }
    ids.customerB = (
      await db.getRepository(Customer).findOne({ where: { store: { id: ids.storeB }, isDefault: true } })
    ).id;

    const saleB = await api()
      .post('/api/orders')
      .set(as('ownerB'))
      .send({ items: [{ productId: ids.productB, quantity: 3 }] })
      .expect(200);
    ids.orderB = saleB.body.order.id;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('lists only the products of the store being worked in', async () => {
    const { body } = await api().get('/api/products').set(as('ownerA')).query({ search: run }).expect(200);

    expect(body.products.map(product => product.id)).toEqual([ids.productA]);
  });

  it("answers 404 for another store's product, category and provider, whatever the route", async () => {
    await api().get(`/api/products/${ids.productB}`).set(as('ownerA')).expect(404);
    await api().put(`/api/products/${ids.productB}`).set(as('ownerA')).send({ stock: 0 }).expect(404);
    await api().delete(`/api/products/${ids.productB}`).set(as('ownerA')).expect(404);
    await api().get(`/api/categories/${ids.categoryB}`).set(as('ownerA')).expect(404);
    await api().put(`/api/categories/${ids.categoryB}`).set(as('ownerA')).send({ name: 'OTRA' }).expect(404);
    await api().get(`/api/providers/${ids.providerB}`).set(as('ownerA')).expect(404);
    await api().delete(`/api/providers/${ids.providerB}`).set(as('ownerA')).expect(404);

    //Nothing of B changed
    const product = await api().get(`/api/products/${ids.productB}`).set(as('ownerB')).expect(200);
    expect(product.body.product.stock).toBe(7);
  });

  it("will not link a product to another store's category or provider", async () => {
    await api().put(`/api/products/${ids.productA}`).set(as('ownerA')).send({ categoryId: ids.categoryB }).expect(404);
    await api().put(`/api/products/${ids.productA}`).set(as('ownerA')).send({ providerId: ids.providerB }).expect(404);
  });

  it("will not sell another store's product, to another store's customer, or touch its sales", async () => {
    await api()
      .post('/api/orders')
      .set(as('cashierA'))
      .send({ items: [{ productId: ids.productB, quantity: 1 }] })
      .expect(404);
    await api()
      .post('/api/orders')
      .set(as('cashierA'))
      .send({ customerId: ids.customerB, items: [{ productId: ids.productA, quantity: 1 }] })
      .expect(404);
    await api().get(`/api/orders/${ids.orderB}`).set(as('ownerA')).expect(404);
    await api().delete(`/api/orders/${ids.orderB}`).set(as('ownerA')).expect(404);
    await api()
      .post(`/api/orders/${ids.orderB}`)
      .set(as('ownerA'))
      .send({ productId: ids.productA, quantity: 1 })
      .expect(404);
  });

  it('leaves nothing behind when a sale cannot be made', async () => {
    const before = await db.query(`SELECT count(*)::int AS n FROM "order" WHERE "id_store" = $1`, [ids.storeA]);
    await api()
      .post('/api/orders')
      .set(as('cashierA'))
      .send({ items: [{ productId: ids.productA, quantity: 999 }] })
      .expect(400);
    const after = await db.query(`SELECT count(*)::int AS n FROM "order" WHERE "id_store" = $1`, [ids.storeA]);

    expect(after[0].n).toBe(before[0].n);
  });

  it("counts only the store's own sales in its reports and its PDF", async () => {
    await api()
      .post('/api/orders')
      .set(as('cashierA'))
      .send({ items: [{ productId: ids.productA, quantity: 1 }] })
      .expect(200);

    const summary = await api().get('/api/reports/summary').set(as('ownerA')).query({ period: 'day' }).expect(200);
    const top = await api().get('/api/reports/top-products').set(as('ownerA')).expect(200);
    const insights = await api().get('/api/reports/product-insights').set(as('ownerA')).expect(200);

    expect(summary.body.summary.current).toMatchObject({ revenue: 28, orders: 1 });
    expect(top.body.products.map(product => product.id)).toEqual([ids.productA]);
    const groups = Object.values(insights.body.insights).filter(group => typeof group === 'object') as {
      items: { id: number }[];
    }[];
    const insightIds = groups.flatMap(group => group.items.map(item => item.id));
    expect(insightIds).not.toContain(ids.productB);

    await api().get('/api/reports/pdf').set(as('ownerA')).expect(200).expect('content-type', /pdf/);
  });

  it('keeps reports and catalogue changes for the owner, and a cashier to their own sales', async () => {
    await api().get('/api/reports/summary').set(as('cashierA')).expect(403);
    await api()
      .post('/api/products')
      .set(as('cashierA'))
      .send({ name: 'X', code: 'X', price: 1, priceSell: 1, stock: 1 })
      .expect(403);
    await api().get('/api/providers').set(as('cashierA')).expect(403);
    await api().get('/api/products').set(as('cashierA')).expect(200);
  });

  it('turns away someone who belongs to no store, and a switch into a store one does not belong to', async () => {
    await api().get('/api/products').set(as('stranger')).expect(403);
    const { body } = await api()
      .post('/api/auth')
      .send({ email: `ownerA-${run}@example.com`, password })
      .expect(201);
    await api()
      .post('/api/auth/switch')
      .set({ Authorization: `Bearer ${body.access_token}` })
      .send({ storeId: ids.storeB })
      .expect(403);
  });

  it('lets a super admin enter any store', async () => {
    const token = await login(`superAdmin-${run}@example.com`, ids.storeB);
    const { body } = await api()
      .get(`/api/products/${ids.productB}`)
      .set({ Authorization: `Bearer ${token}` })
      .expect(200);

    expect(body.product.name).toBe('Leche B');
  });

  it('stops a removed member at the next request, not when their token expires', async () => {
    const extra = await app.get(UsersService).create({
      name: 'Temp',
      lastName: run,
      phone: '5512345678',
      image: '',
      email: `temp-${run}@example.com`,
      password,
    });
    await app.get(StoresService).addMember(ids.storeA, extra.id, 'CASHIER');
    const token = await login(`temp-${run}@example.com`, ids.storeA);
    await api()
      .get('/api/products')
      .set({ Authorization: `Bearer ${token}` })
      .expect(200);

    await db.getRepository(StoreMember).delete({ user: { id: extra.id } });

    await api()
      .get('/api/products')
      .set({ Authorization: `Bearer ${token}` })
      .expect(403);
  });

  it('shows only the public products of an open store in its catalogue, without costs', async () => {
    await api().put(`/api/products/${ids.productA}`).set(as('ownerA')).send({ isPublic: true }).expect(200);

    const { body } = await api().get(`/api/stores/store-a-${run}/catalog`).expect(200);
    expect(body.products.map(product => product.name)).toEqual(['Leche A']);
    expect(body.products[0]).not.toHaveProperty('price');
    expect(body.products[0]).not.toHaveProperty('stock');

    const otherStore = await api().get(`/api/stores/store-b-${run}/catalog`).expect(200);
    expect(otherStore.body.products).toEqual([]);

    await db.getRepository(Store).update({ id: ids.storeB }, { active: false });
    await api().get(`/api/stores/store-b-${run}/catalog`).expect(404);
    await api().get('/api/products').set(as('ownerB')).expect(403);
  });
});
