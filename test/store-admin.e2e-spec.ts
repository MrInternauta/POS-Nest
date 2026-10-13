import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/setup';
import { UsersService } from '../src/users/services/users.service';

/**
 * Running stores: opening one, its team, its customers, passwords and the super admin's switch.
 * Against a real, migrated Postgres (DATABASE_URL), like stores.e2e-spec.ts.
 */
const describeWithDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeWithDatabase('Running stores (e2e)', () => {
  let app: INestApplication;
  let db: DataSource;
  const run = Date.now().toString(36);
  //Made per run, like the users: nothing that reads as a password lives in the code
  const secret = (label: string) => `${label}-${run}-${Math.random().toString(36).slice(2)}`;
  const password = secret('own');
  const temporary = secret('temp');
  const changed = secret('changed');
  const ownerPicked = secret('picked');
  const email = (who: string) => `${who}-${run}@example.com`;

  const api = () => request(app.getHttpServer());
  const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

  const signUp = async (who: string) => {
    await api()
      .post('/api/users')
      .send({ name: who, lastName: run, phone: '5512345678', image: '', email: email(who), password })
      .expect(200);
    const { body } = await api()
      .post('/api/auth')
      .send({ email: email(who), password })
      .expect(201);
    return body;
  };

  let owner: { token: string; storeId: number; slug: string };
  let otherOwner: { token: string; storeId: number };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    db = app.get(DataSource);

    const created = await signUp('owner');
    const store = await api()
      .post('/api/stores')
      .set(bearer(created.access_token))
      .send({ name: `Abarrotes Doña Lupe ${run}` })
      .expect(200);
    owner = { token: store.body.access_token, storeId: store.body.store.id, slug: store.body.store.slug };

    const other = await signUp('other');
    const otherStore = await api()
      .post('/api/stores')
      .set(bearer(other.access_token))
      .send({ name: `Otra ${run}` })
      .expect(200);
    otherOwner = { token: otherStore.body.access_token, storeId: otherStore.body.store.id };
  });

  afterAll(async () => {
    await app?.close();
  });

  it('opens a store for someone who just signed up, making them its owner', async () => {
    const fresh = await signUp('fresh');
    expect(fresh.store).toBeNull();
    expect(fresh.stores).toEqual([]);
    await api().get('/api/products').set(bearer(fresh.access_token)).expect(403);

    expect(owner.slug).toBe(`abarrotes-dona-lupe-${run}`);
    const { body } = await api().get('/api/stores/mine').set(bearer(owner.token)).expect(200);
    expect(body.stores).toEqual([
      { id: owner.storeId, name: `Abarrotes Doña Lupe ${run}`, slug: owner.slug, role: 'OWNER' },
    ]);
    await api().get('/api/products').set(bearer(owner.token)).expect(200);
  });

  it('gives a second store with the same name its own link', async () => {
    const twin = await signUp('twin');
    const { body } = await api()
      .post('/api/stores')
      .set(bearer(twin.access_token))
      .send({ name: `Abarrotes Doña Lupe ${run}` })
      .expect(200);

    expect(body.store.slug).toBe(`abarrotes-dona-lupe-${run}-2`);
  });

  it('lets the owner add a new cashier with a temporary password, who can then change it', async () => {
    const added = await api()
      .post('/api/stores/current/members')
      .set(bearer(owner.token))
      .send({ email: email('cashier'), name: 'Caja', role: 'CASHIER', password: temporary })
      .expect(200);
    expect(added.body.member).toMatchObject({ role: 'CASHIER', user: { email: email('cashier') } });

    const login = await api()
      .post('/api/auth')
      .send({ email: email('cashier'), password: temporary })
      .expect(201);
    expect(login.body.store).toMatchObject({ id: owner.storeId, role: 'CASHIER' });

    await api()
      .post('/api/auth/password')
      .set(bearer(login.body.access_token))
      .send({ currentPassword: secret('wrong'), newPassword: changed })
      .expect(403);
    await api()
      .post('/api/auth/password')
      .set(bearer(login.body.access_token))
      .send({ currentPassword: temporary, newPassword: changed })
      .expect(200);
    await api()
      .post('/api/auth')
      .send({ email: email('cashier'), password: temporary })
      .expect(401);
    await api()
      .post('/api/auth')
      .send({ email: email('cashier'), password: changed })
      .expect(201);
  });

  it('adds an existing account as it is: the owner cannot set its password', async () => {
    await signUp('existing');
    await api()
      .post('/api/stores/current/members')
      .set(bearer(owner.token))
      .send({ email: email('existing'), role: 'CASHIER', password: ownerPicked })
      .expect(200);

    await api()
      .post('/api/auth')
      .send({ email: email('existing'), password: ownerPicked })
      .expect(401);
    const { body } = await api()
      .post('/api/auth')
      .send({ email: email('existing'), password })
      .expect(201);
    expect(body.stores.map(store => store.id)).toEqual([owner.storeId]);
  });

  it('refuses a new account without a name or password, someone already in, and a switched off account', async () => {
    await api()
      .post('/api/stores/current/members')
      .set(bearer(owner.token))
      .send({ email: email('nobody'), role: 'CASHIER' })
      .expect(400);
    await api()
      .post('/api/stores/current/members')
      .set(bearer(owner.token))
      .send({ email: email('cashier'), role: 'CASHIER' })
      .expect(400);

    const users = app.get(UsersService);
    const former = await users.create({
      name: 'Former',
      lastName: run,
      phone: '',
      image: '',
      email: email('former'),
      password,
    });
    await db.query(`UPDATE "user" SET "active" = false WHERE "id" = $1`, [former.id]);
    await api()
      .post('/api/stores/current/members')
      .set(bearer(owner.token))
      .send({ email: email('former'), role: 'CASHIER' })
      .expect(400);
  });

  it('keeps the team for the owner, and another store’s members out of reach', async () => {
    const cashier = await api()
      .post('/api/auth')
      .send({ email: email('cashier'), password: changed })
      .expect(201);
    await api().get('/api/stores/current/members').set(bearer(cashier.body.access_token)).expect(403);
    await api()
      .post('/api/stores/current/members')
      .set(bearer(cashier.body.access_token))
      .send({ email: email('x'), role: 'OWNER' })
      .expect(403);

    const team = await api().get('/api/stores/current/members').set(bearer(owner.token)).expect(200);
    const cashierMember = team.body.members.find(member => member.user.email === email('cashier'));
    await api().delete(`/api/stores/current/members/${cashierMember.id}`).set(bearer(otherOwner.token)).expect(404);
    await api()
      .put(`/api/stores/current/members/${cashierMember.id}`)
      .set(bearer(otherOwner.token))
      .send({ role: 'OWNER' })
      .expect(404);
  });

  it('always keeps an owner', async () => {
    const team = await api().get('/api/stores/current/members').set(bearer(owner.token)).expect(200);
    const me = team.body.members.find(member => member.user.email === email('owner'));

    await api()
      .put(`/api/stores/current/members/${me.id}`)
      .set(bearer(owner.token))
      .send({ role: 'CASHIER' })
      .expect(400);
    await api().delete(`/api/stores/current/members/${me.id}`).set(bearer(owner.token)).expect(400);
  });

  it('stops a removed cashier at once', async () => {
    const cashier = await api()
      .post('/api/auth')
      .send({ email: email('cashier'), password: changed })
      .expect(201);
    const team = await api().get('/api/stores/current/members').set(bearer(owner.token)).expect(200);
    const member = team.body.members.find(m => m.user.email === email('cashier'));

    await api().delete(`/api/stores/current/members/${member.id}`).set(bearer(owner.token)).expect(200);

    await api().get('/api/products').set(bearer(cashier.body.access_token)).expect(403);
  });

  it("keeps each store's customers, its default one first, and sells to them", async () => {
    const created = await api()
      .post('/api/customers')
      .set(bearer(owner.token))
      .send({ name: 'Doña Mary', phone: '5511112222' })
      .expect(200);
    const customerId = created.body.customer.id;

    const list = await api().get('/api/customers').set(bearer(owner.token)).expect(200);
    expect(list.body.customers.map(customer => customer.name)).toEqual(['Público en general', 'Doña Mary']);
    const defaultId = list.body.customers[0].id;

    await api().get(`/api/customers/${customerId}`).set(bearer(otherOwner.token)).expect(404);
    await api().put(`/api/customers/${customerId}`).set(bearer(otherOwner.token)).send({ name: 'X' }).expect(404);
    await api().delete(`/api/customers/${defaultId}`).set(bearer(owner.token)).expect(400);

    const product = await api()
      .post('/api/products')
      .set(bearer(owner.token))
      .send({ name: 'Gansito', code: `G-${run}`, price: 10, priceSell: 15, stock: 5 })
      .expect(200);
    const sale = await api()
      .post('/api/orders')
      .set(bearer(owner.token))
      .send({ customerId, items: [{ productId: product.body.product.id, quantity: 1 }] })
      .expect(200);
    expect(sale.body.order.customer.name).toBe('Doña Mary');

    const anonymous = await api()
      .post('/api/orders')
      .set(bearer(owner.token))
      .send({ items: [{ productId: product.body.product.id, quantity: 1 }] })
      .expect(200);
    expect(anonymous.body.order.customer.name).toBe('Público en general');
  });

  it('lets the owner change the store, but not its link', async () => {
    const { body } = await api()
      .put('/api/stores/current')
      .set(bearer(owner.token))
      .send({ phone: '5599998888', timezone: 'America/Tijuana' })
      .expect(200);
    expect(body.store).toMatchObject({ phone: '5599998888', timezone: 'America/Tijuana', slug: owner.slug });

    await api().put('/api/stores/current').set(bearer(owner.token)).send({ timezone: 'Mars/Olympus' }).expect(400);
    await api().put('/api/stores/current').set(bearer(owner.token)).send({ slug: 'mine' }).expect(400);
  });

  it('lets only a super admin list every store and switch one off', async () => {
    await api().get('/api/admin/stores').set(bearer(owner.token)).expect(403);

    const admin = await signUp('admin');
    await app.get(UsersService).setSuperAdmin(admin.user.id, true);
    const { body: login } = await api()
      .post('/api/auth')
      .send({ email: email('admin'), password })
      .expect(201);

    const list = await api().get('/api/admin/stores').set(bearer(login.access_token)).query({ limit: 50 }).expect(200);
    expect(list.body.stores.find(store => store.id === owner.storeId)).toMatchObject({ owners: [email('owner')] });

    await api()
      .put(`/api/admin/stores/${otherOwner.storeId}/status`)
      .set(bearer(login.access_token))
      .send({ active: false })
      .expect(200);
    await api().get('/api/products').set(bearer(otherOwner.token)).expect(403);
    await api()
      .put(`/api/admin/stores/${otherOwner.storeId}/status`)
      .set(bearer(login.access_token))
      .send({ active: true })
      .expect(200);
    await api().get('/api/products').set(bearer(otherOwner.token)).expect(200);
  });
});
