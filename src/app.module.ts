import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';

@Module({
  controllers: [AppController],
  imports: [ProductsModule, UsersModule],
  providers: [AppService],
})
export class AppModule {}
