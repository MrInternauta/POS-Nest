import { HttpModule, HttpService } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { enviroments } from './enviroments';
import config from './config';
@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      envFilePath: enviroments[process?.env?.NODE_ENV] || '.env',
      load: [config],
      isGlobal: true,
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
