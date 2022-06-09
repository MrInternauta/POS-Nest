import { Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { CustomersService } from './services/customers.service';

@Module({
  providers: [UsersService, CustomersService],
  controllers: [UsersController],
})
export class UsersModule {}
