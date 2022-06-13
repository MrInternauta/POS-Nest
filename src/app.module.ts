import { HttpModule, HttpService } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
@Module({
  controllers: [AppController],
  imports: [ProductsModule, UsersModule, HttpModule, DatabaseModule],
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
