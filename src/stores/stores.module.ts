import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Customer } from './entities/customer.entity';
import { StoreMember } from './entities/store-member.entity';
import { Store } from './entities/store.entity';
import { StoreGuard } from './guards/store.guard';
import { StoresService } from './services/stores.service';

//Every store's data goes through StoreGuard, so the guard and its service are everywhere
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Store, StoreMember, Customer])],
  providers: [StoresService, StoreGuard],
  exports: [StoresService, StoreGuard, TypeOrmModule],
})
export class StoresModule {}
