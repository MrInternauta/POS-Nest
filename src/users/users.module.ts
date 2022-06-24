import { Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { CustomersService } from './services/customers.service';
import { ProductsModule } from '../products/products.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Customer } from './entities/customer.entity';

@Module({
  imports: [ProductsModule, TypeOrmModule.forFeature([User, Customer])],
  providers: [
    UsersService,
    CustomersService,
    // {
    // 	provide: ProducsService, // Nombre con el que haremos referencia a ella
    // 	useClass: ProducsService // Nombre de la clase que se usara
    // }
  ], // Aqui por ejemplo],
  controllers: [UsersController],
})
export class UsersModule {}
