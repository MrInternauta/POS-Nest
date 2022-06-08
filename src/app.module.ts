import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';

@Module({
  controllers: [AppController],
  imports: [ProductsModule],
  providers: [AppService],
})
export class AppModule {}
