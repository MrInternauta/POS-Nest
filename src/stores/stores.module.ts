import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Customer } from './entities/customer.entity';
import { StoreMember } from './entities/store-member.entity';
import { Store } from './entities/store.entity';
import { StoresService } from './services/stores.service';

@Module({
  imports: [TypeOrmModule.forFeature([Store, StoreMember, Customer])],
  providers: [StoresService],
  exports: [StoresService, TypeOrmModule],
})
export class StoresModule {}
