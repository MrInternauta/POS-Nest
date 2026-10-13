import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

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

  /** The customer a sale gets when nobody is picked; every store is created with one */
  async defaultCustomer(storeId: number): Promise<Customer> {
    const customer = await this.customerRepo.findOne({ where: { store: { id: storeId }, isDefault: true } });
    if (!customer) {
      throw new InternalServerErrorException(`Store ${storeId} has no default customer`);
    }
    return customer;
  }
}
