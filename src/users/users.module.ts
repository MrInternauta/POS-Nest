import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrdersModule } from '../orders/orders.module';

import { ProductsModule } from '../products/products.module';
import { RolesController } from './controllers/rols.controller';
import { UsersController } from './controllers/users.controller';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { User } from './entities/user.entity';
import { RolesService } from './services/roles.service';
import { UsersService } from './services/users.service';

@Module({
  imports: [forwardRef(() => OrdersModule), ProductsModule, TypeOrmModule.forFeature([User, Role, Permission])],
  exports: [UsersService, RolesService],
  providers: [UsersService, RolesService],
  controllers: [UsersController, RolesController],
})
export class UsersModule {}
