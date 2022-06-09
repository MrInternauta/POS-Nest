import { HttpModule, HttpService } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';
const API_KEY = '12345634';
const API_KEY_PROD = 'PROD1212121SA';
@Module({
  controllers: [AppController],
  imports: [ProductsModule, UsersModule, HttpModule],
  providers: [
    AppService,
    {
      provide: 'API_KEY',
      useValue: process.env.NODE_ENV === 'prod' ? API_KEY_PROD : API_KEY,
    },
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
