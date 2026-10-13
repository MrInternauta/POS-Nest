import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ILike, Not, Repository } from 'typeorm';

import { PayloadToken } from '../../core/auth/models/token.model';
import { FilterDto } from '../../core/interfaces/filter.dto';
import { CreateCustomerDto, CustomerFilterDto, UpdateCustomerDto } from '../dtos/customer.dto';
import { CreateStoreDto, UpdateStoreDto } from '../dtos/store.dto';
import { Customer, DEFAULT_CUSTOMER_NAME } from '../entities/customer.entity';
import { StoreMember, StoreRole } from '../entities/store-member.entity';
import { Store } from '../entities/store.entity';

/** The store the data from before stores existed was moved into */
export const MAIN_STORE_SLUG = 'tienda-principal';

/** "Abarrotes Doña Lupe" → "abarrotes-dona-lupe", the part of a store's public link */
export function slugify(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return slug || 'tienda';
}

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store) private storeRepo: Repository<Store>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(StoreMember) private memberRepo: Repository<StoreMember>
  ) {}

  findById(id: number) {
    return this.storeRepo.findOneBy({ id });
  }

  findBySlug(slug: string) {
    return this.storeRepo.findOneBy({ slug });
  }

  /** The stores a user works in, oldest membership first; switched off stores are left out */
  async membershipsOf(userId: number): Promise<{ store: Store; role: StoreRole }[]> {
    const members = await this.memberRepo.find({
      where: { user: { id: userId }, store: { active: true } },
      relations: ['store'],
      order: { createAt: 'ASC', id: 'ASC' },
    });
    return members.map(member => ({ store: member.store, role: member.role }));
  }

  /**
   * The store a user may work in and their role there. A super admin enters any store, switched
   * off ones included, with no role of their own unless they are also a member.
   */
  async access(
    userId: number,
    superAdmin: boolean,
    storeId: number
  ): Promise<{ store: Store; role: StoreRole | null }> {
    const store = await this.storeRepo.findOneBy({ id: storeId });
    const member = store
      ? await this.memberRepo.findOne({ where: { store: { id: storeId }, user: { id: userId } } })
      : null;

    if (store && superAdmin) {
      return { store, role: member?.role ?? null };
    }
    //A store someone does not belong to answers like one that does not exist
    if (!store || !member) {
      throw new ForbiddenException('You do not belong to this store');
    }
    if (!store.active) {
      throw new ForbiddenException('This store is switched off');
    }
    return { store, role: member.role };
  }

  /** What StoreGuard checks on every request to a store's data */
  resolveAccess(user: PayloadToken) {
    if (!user?.storeId) {
      throw new ForbiddenException('Choose or create a store first');
    }
    return this.access(Number(user.sub), !!user.superAdmin, Number(user.storeId));
  }

  /**
   * Until requests carry their store, everything is created in the main store. The migration
   * creates it, so not finding it means the database was not migrated.
   */
  async mainStore(): Promise<Store> {
    const store = await this.storeRepo.findOneBy({ slug: MAIN_STORE_SLUG });
    if (!store) {
      throw new InternalServerErrorException('The main store is missing, run the migrations');
    }
    return store;
  }

  /** Puts a user in a store as `role`, or changes their role if they already are */
  async addMember(storeId: number, userId: number, role: StoreRole): Promise<StoreMember> {
    const existing = await this.memberRepo.findOne({ where: { store: { id: storeId }, user: { id: userId } } });
    if (existing) {
      existing.role = role;
      return this.memberRepo.save(existing);
    }
    return this.memberRepo.save(this.memberRepo.create({ store: { id: storeId }, user: { id: userId }, role }));
  }

  createCustomer(storeId: number, data: Partial<Pick<CreateCustomerDto, 'name' | 'phone' | 'email' | 'notes'>>) {
    return this.customerRepo.save(this.customerRepo.create({ ...data, store: { id: storeId } }));
  }

  async isMember(storeId: number, userId: number): Promise<boolean> {
    return (await this.memberRepo.count({ where: { store: { id: storeId }, user: { id: userId } } })) > 0;
  }

  /** A customer of `storeId`; another store's answers like a missing one */
  async findCustomer(storeId: number, customerId: number): Promise<Customer> {
    const customer = await this.customerRepo.findOne({ where: { id: customerId, store: { id: storeId } } });
    if (!customer) {
      throw new NotFoundException(`Customer ${customerId} not found`);
    }
    return customer;
  }

  /** The customer a sale gets when nobody is picked; every store is created with one */
  async defaultCustomer(storeId: number): Promise<Customer> {
    const customer = await this.customerRepo.findOne({ where: { store: { id: storeId }, isDefault: true } });
    if (!customer) {
      throw new InternalServerErrorException(`Store ${storeId} has no default customer`);
    }
    return customer;
  }

  /** A new store, with its default customer, owned by `ownerId`. All of it or none of it is saved */
  async createStore(ownerId: number, dto: CreateStoreDto): Promise<Store> {
    const slug = await this.freeSlug(slugify(dto.name));
    return this.storeRepo.manager.transaction(async manager => {
      const store = await manager.save(manager.create(Store, { ...dto, slug }));
      await manager.save(manager.create(Customer, { name: DEFAULT_CUSTOMER_NAME, isDefault: true, store }));
      await manager.save(manager.create(StoreMember, { store, user: { id: ownerId }, role: 'OWNER' }));
      return store;
    });
  }

  /** `base`, or `base-2`, `base-3`… whichever no store has yet */
  private async freeSlug(base: string): Promise<string> {
    const taken = new Set(
      (await this.storeRepo.find({ where: { slug: ILike(`${base}%`) }, withDeleted: true, select: ['slug'] })).map(
        store => store.slug
      )
    );
    let slug = base;
    for (let n = 2; taken.has(slug); n++) {
      slug = `${base}-${n}`;
    }
    return slug;
  }

  async updateStore(storeId: number, dto: UpdateStoreDto): Promise<Store> {
    const store = await this.storeRepo.findOneBy({ id: storeId });
    if (!store) {
      throw new NotFoundException(`Store ${storeId} not found`);
    }
    //The slug stays: it is in links people already shared
    this.storeRepo.merge(store, dto);
    return this.storeRepo.save(store);
  }

  /** Every store, for the super admin, with how many people work in each and who owns it */
  async listAll(params?: FilterDto) {
    const [stores, total] = await this.storeRepo.findAndCount({
      relations: ['members', 'members.user'],
      order: { createAt: 'DESC', id: 'DESC' },
      take: params?.limit ?? 50,
      skip: params?.offset ?? 0,
    });
    return {
      total,
      stores: stores.map(({ members, ...store }) => ({
        ...store,
        members: members.length,
        owners: members.filter(member => member.role === 'OWNER').map(member => member.user.email),
      })),
    };
  }

  async setActive(storeId: number, active: boolean): Promise<Store> {
    const store = await this.storeRepo.findOneBy({ id: storeId });
    if (!store) {
      throw new NotFoundException(`Store ${storeId} not found`);
    }
    store.active = active;
    return this.storeRepo.save(store);
  }

  /** Who works in the store, owners first */
  async members(storeId: number) {
    const members = await this.memberRepo.find({
      where: { store: { id: storeId } },
      relations: ['user'],
      order: { role: 'DESC', createAt: 'ASC' },
    });
    return members.map(member => ({
      id: member.id,
      role: member.role,
      since: member.createAt,
      user: {
        id: member.user.id,
        name: member.user.name,
        lastName: member.user.lastName,
        email: member.user.email,
        phone: member.user.phone,
        image: member.user.image,
      },
    }));
  }

  private async findMember(storeId: number, memberId: number): Promise<StoreMember> {
    const member = await this.memberRepo.findOne({
      where: { id: memberId, store: { id: storeId } },
      relations: ['user'],
    });
    if (!member) {
      throw new NotFoundException(`Member ${memberId} not found`);
    }
    return member;
  }

  /** A store always keeps an owner: the last one can be neither demoted nor removed */
  private async assertAnotherOwner(storeId: number, member: StoreMember) {
    if (member.role !== 'OWNER') return;
    const owners = await this.memberRepo.count({ where: { store: { id: storeId }, role: 'OWNER' } });
    if (owners <= 1) {
      throw new BadRequestException('The store needs at least one owner');
    }
  }

  async changeMemberRole(storeId: number, memberId: number, role: StoreRole) {
    const member = await this.findMember(storeId, memberId);
    if (member.role !== role) {
      await this.assertAnotherOwner(storeId, member);
      member.role = role;
      await this.memberRepo.save(member);
    }
    return member;
  }

  async removeMember(storeId: number, memberId: number) {
    const member = await this.findMember(storeId, memberId);
    await this.assertAnotherOwner(storeId, member);
    await this.memberRepo.delete({ id: member.id });
  }

  /** The store's customers, the default one first, then by name */
  async customers(storeId: number, params?: CustomerFilterDto) {
    const base = { store: { id: storeId } };
    const term = params?.search?.trim();
    const where = term
      ? [
          { ...base, name: ILike(`%${term}%`) },
          { ...base, phone: ILike(`%${term}%`) },
          { ...base, email: ILike(`%${term}%`) },
        ]
      : base;
    const [customers, total] = await this.customerRepo.findAndCount({
      where,
      order: { isDefault: 'DESC', name: 'ASC', id: 'ASC' },
      take: params?.limit ?? 20,
      skip: params?.offset ?? 0,
    });
    return { customers, total };
  }

  addCustomer(storeId: number, dto: CreateCustomerDto) {
    return this.createCustomer(storeId, dto);
  }

  async updateCustomer(storeId: number, customerId: number, changes: UpdateCustomerDto) {
    const customer = await this.findCustomer(storeId, customerId);
    this.customerRepo.merge(customer, changes);
    return this.customerRepo.save(customer);
  }

  /** The default customer stays: every sale without a customer needs it */
  async removeCustomer(storeId: number, customerId: number) {
    const customer = await this.findCustomer(storeId, customerId);
    if (customer.isDefault) {
      throw new BadRequestException('The default customer cannot be deleted');
    }
    await this.customerRepo.softDelete({ id: customer.id, isDefault: Not(true) });
  }
}
