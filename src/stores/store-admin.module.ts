import { Module } from '@nestjs/common';

import { UsersModule } from '../users/users.module';
import { AdminStoresController } from './controllers/admin-stores.controller';
import { CustomersController } from './controllers/customers.controller';
import { StoresController } from './controllers/stores.controller';
import { TeamService } from './services/team.service';

/**
 * The routes to run stores: open one, its team, its customers, and the super admin's list. Apart
 * from StoresModule, which everything else imports, because adding staff creates user accounts
 */
@Module({
  imports: [UsersModule],
  providers: [TeamService],
  controllers: [StoresController, CustomersController, AdminStoresController],
})
export class StoreAdminModule {}
