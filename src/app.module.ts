import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import * as Joi from 'joi';

import { config } from './config';
import { AuthModule } from './core/auth/auth.module';
import enviroments from './core/config/enviroments';
import { DatabaseModule } from './core/database/database.module';
import { AppController } from './home/app.controller';
import { AppService } from './home/app.service';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      envFilePath: (() => {
        return process?.env?.NODE_ENV ? enviroments[process?.env?.NODE_ENV] : enviroments.dev;
      })(),
      load: [config],
      isGlobal: true,
      validationSchema: Joi.object({
        API_KEY: Joi.string().required(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().required(),
        POSTGRES_PORT: Joi.number().required(),
        POSTGRES_HOST: Joi.string().required(), //hostname()
        POSTGRES_HOST_EXTERNAL: Joi.string().required(),
        POSTGRES_PORT_EXTERNAL: Joi.number().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().required(),
        IMAGES_PATH: Joi.string().required(),
      }),
    }),
    DatabaseModule,
    ProductsModule,
    UsersModule,
    HttpModule,
    OrdersModule,
    AuthModule,
  ],
  providers: [AppService],
})
export class AppModule {}
