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
          type: 'postgres',
          host: configService.postgres.host,
          port: configService.postgres.port,
          username: configService.postgres.user,
          password: configService.postgres.password,
          database: configService.postgres.database,
          autoLoadEntities: true,
          synchronize: false,
          logging: false,
          ssl: false,
        };
      },
      imports: undefined,
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
