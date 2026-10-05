import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';

import * as Joi from 'joi';
import * as path from 'path';

import { config } from './config';
import { AuthModule } from './core/auth/auth.module';
import enviroments from './core/config/enviroments';
import { DatabaseModule } from './core/database/database.module';
import { AppController } from './home/app.controller';
import { AppService } from './home/app.service';
import { BlobImageStorage, DiskImageStorage, ImageStorage } from './home/image-storage';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { ReportsModule } from './reports/reports.module';
import { UsersModule } from './users/users.module';

const withoutDatabaseUrl = (schema: Joi.Schema) =>
  schema.when('DATABASE_URL', { is: Joi.exist(), then: Joi.optional(), otherwise: Joi.required() });

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      envFilePath: (() => {
        return process?.env?.NODE_ENV ? enviroments[process?.env?.NODE_ENV] : enviroments.dev;
      })(),
      load: [config],
      isGlobal: true,
      validationSchema: Joi.object({
        API_KEY: Joi.string().required(),
        DATABASE_URL: Joi.string().uri(),
        DATABASE_URL_UNPOOLED: Joi.string().uri(),
        POSTGRES_SSL: Joi.boolean().default(false),
        //The separate values are only needed when there is no connection string
        POSTGRES_DB: withoutDatabaseUrl(Joi.string()),
        POSTGRES_USER: withoutDatabaseUrl(Joi.string()),
        POSTGRES_PASSWORD: withoutDatabaseUrl(Joi.string()),
        POSTGRES_PORT: withoutDatabaseUrl(Joi.number()),
        POSTGRES_HOST: withoutDatabaseUrl(Joi.string()), //hostname()
        //Only the migrations CLI reads these, from outside the docker network
        POSTGRES_HOST_EXTERNAL: Joi.string(),
        POSTGRES_PORT_EXTERNAL: Joi.number(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().required(),
        IMAGES_PATH: Joi.string().default('files/images'),
        BLOB_READ_WRITE_TOKEN: Joi.string(),
      }),
    }),
    DatabaseModule,
    ProductsModule,
    UsersModule,
    HttpModule,
    OrdersModule,
    ReportsModule,
    AuthModule,
  ],
  providers: [
    AppService,
    {
      provide: ImageStorage,
      inject: [config.KEY],
      useFactory: (configService: ConfigType<typeof config>) =>
        configService.blob_token
          ? new BlobImageStorage(configService.blob_token)
          : new DiskImageStorage(path.resolve(__dirname, '..', configService.IMAGES_PATH)),
    },
  ],
})
export class AppModule {}
