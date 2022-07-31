import { HttpModule, HttpService } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import enviroments from './config/enviroments';
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
