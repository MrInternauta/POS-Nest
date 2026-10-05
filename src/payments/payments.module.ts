import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Order } from '../orders/entities/order.entity';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { PaymentsController } from './controllers/payments.controller';
import { StoreSetting } from './entities/store-setting.entity';
import { MercadoPagoClient } from './services/mercado-pago.client';
import { PaymentsService } from './services/payments.service';

@Module({
  imports: [OrdersModule, ProductsModule, TypeOrmModule.forFeature([StoreSetting, Order])],
  providers: [PaymentsService, MercadoPagoClient],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
