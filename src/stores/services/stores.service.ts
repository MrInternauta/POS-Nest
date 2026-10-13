import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { PayloadToken } from '../../core/auth/models/token.model';
import { Customer } from '../entities/customer.entity';
import { StoreMember, StoreRole } from '../entities/store-member.entity';
import { Store } from '../entities/store.entity';

/** The store the data from before stores existed was moved into */
export const MAIN_STORE_SLUG = 'tienda-principal';

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

  createCustomer(storeId: number, data: Partial<Pick<Customer, 'name' | 'phone' | 'email' | 'notes'>>) {
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
}
