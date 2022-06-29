import { HttpModule, HttpService } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { default as enviroments } from './enviroments.js';
import { config } from './config';
import * as Joi from 'joi';

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
        /* A global variable that can be used in any module. */
        /* A global variable that can be used in any module. */
        API_KEY: Joi.string().required(),
        DATA_BASE: Joi.string().required(),
        DATA_PORT: Joi.number().required(),
        POSTGRES_DB: Joi.string().required(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().required(),
        POSTGRES_PORT: Joi.number().required(),
        POSTGRES_HOST: Joi.string().hostname().required(),
      }),
    }),
    ProductsModule,
    UsersModule,
    HttpModule,
    DatabaseModule,
  ],
  providers: [
    AppService,
    {
      //npm i --save @nestjs/axios
      provide: 'MyAsync',
      useFactory: async function (http: HttpService) {
        const myTask = await http
          .get('https://jsonplaceholder.typicode.com/todos')
          .toPromise();

        return myTask.data;
      },
      inject: [HttpService], //INJECT DEPENDENCY TO THE PROVIDER
    },
  ],
})
export class AppModule {}
