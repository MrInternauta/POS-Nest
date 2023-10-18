import { Global, Module } from '@nestjs/common';
// const API_KEY = '12345634';
// const API_KEY_PROD = 'PROD1212121SA';
import { ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// import { Client } from 'pg';
import { config } from '../../config';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [config.KEY],
      useFactory: async (configService: ConfigType<typeof config>) => {
        return {
          type: 'mysql',
          host: configService.mysql.host,
          port: configService.mysql.port,
          username: configService.mysql.user,
          password: configService.mysql.password,
          database: configService.mysql.database,
          synchronize: true,
          autoLoadEntities: true,
        };
      },
    }),
  ],
  providers: [
    // {
    //   provide: 'API_KEY',
    //   useValue: process.env.NODE_ENV === 'prod' ? API_KEY_PROD : API_KEY,
    // },
    // {
    //   provide: 'DB_CONNECTION',
    //   useFactory: (configService: ConfigType<typeof config>) => {
    //     const client = new Client({
    //       user: configService.postgres.user,
    //       password: configService.postgres.password,
    //       host: configService.postgres.host,
    //       database: configService.postgres.database,
    //       port: configService.postgres.port,
    //     });
    //     client.connect();
    //     return client;
    //   },
    //   inject: [config.KEY],
    // },
  ],
  exports: [TypeOrmModule], //'DB_CONNECTION' 'API_KEY', 'DB_CONNECTION'
})
export class DatabaseModule {}
