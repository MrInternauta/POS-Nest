import { Module, Global } from '@nestjs/common';
import config from '../config';
const API_KEY = '12345634';
const API_KEY_PROD = 'PROD1212121SA';
// import { Client } from 'pg';
import { ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigType<typeof config>) => {
        return {
          type: 'mysql',
          username: configService.mysql.user,
          password: configService.mysql.password,
          host: configService.mysql.host,
          database: configService.mysql.database,
          port: configService.mysql.port,
          synchronize: true,
          autoLoadEntities: true,
        };
      },
      inject: [config.KEY],
    }),
  ],
  providers: [
    {
      provide: 'API_KEY',
      useValue: process.env.NODE_ENV === 'prod' ? API_KEY_PROD : API_KEY,
    },
    // {
    //   provide: 'DB_CONNECTION',
    //   useFactory: (configService: ConfigType<typeof config>) => {
    //     const client = new Client({
    //       user: configService.mysql.user,
    //       password: configService.mysql.password,
    //       host: configService.mysql.host,
    //       database: configService.mysql.database,
    //       port: configService.mysql.port,
    //     });
    //     client.connect();
    //     return client;
    //   },
    //   inject: [config.KEY],
    // },
  ],
  exports: ['API_KEY', TypeOrmModule], //'DB_CONNECTION'
})
export class DatabaseModule {}
