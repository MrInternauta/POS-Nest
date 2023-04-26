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
    AuthModule,
    ConfigModule.forRoot({
      envFilePath: process?.env?.NODE_ENV ? enviroments[process?.env?.NODE_ENV] : enviroments.dev,
      load: [config],
      isGlobal: true,
      validationSchema: Joi.object({
        API_KEY: Joi.string().required(),
        POSTGRES_DB: Joi.string().required(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().required(),
        POSTGRES_PORT: Joi.number().required(),
        POSTGRES_HOST: Joi.string().required(), //hostname()
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().required(),
      }),
    }),
    DatabaseModule,
    ProductsModule,
    UsersModule,
    HttpModule,
    OrdersModule,
  ],
  providers: [
    AppService,
    // {
    //   //npm i --save @nestjs/axios
    //   provide: 'MyAsync',
    //   useFactory: async function (http: HttpService) {
    //     const myTask = await http
    //       .get('https://jsonplaceholder.typicode.com/todos')
    //       .toPromise();

    //     return myTask.data;
    //   },
    //   inject: [HttpService], //INJECT DEPENDENCY TO THE PROVIDER
    // },
  ],
})
export class AppModule {}
