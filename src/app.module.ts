import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { config } from './config';
import enviroments from './config/enviroments';
import { DatabaseModule } from './database/database.module';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      envFilePath: process?.env?.NODE_ENV
        ? enviroments[process?.env?.NODE_ENV]
        : enviroments.dev,
      load: [config],
      isGlobal: true,
      validationSchema: Joi.object({
        API_KEY: Joi.string().required(),
        POSTGRES_DB: Joi.string().required(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().required(),
        POSTGRES_PORT: Joi.number().required(),
        POSTGRES_HOST: Joi.string().required(), //hostname()
      }),
    }),
    DatabaseModule,
    ProductsModule,
    UsersModule,
    AuthModule,
    HttpModule,
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
