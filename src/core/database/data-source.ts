import 'reflect-metadata';

import { configObj } from '@project/config';
import { DataSource } from 'typeorm';

const type = 'postgres';
export const AppDataSource = new DataSource({
  type: type,
  host: configObj[type].host_external,
  port: configObj[type].port_external,
  username: configObj[type].user,
  password: configObj[type].password,
  database: configObj[type].database,
  synchronize: false,
  logging: false,
  ssl: false,
  entities: ['src/*/entities/*.entity.ts'],
  migrations: ['src/core/database/migrations/*-migration.ts'],
});
//npx gulp --command "migrations:show"
