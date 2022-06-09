import { Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { CustomersService } from './services/customers.service';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [ProductsModule],
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
