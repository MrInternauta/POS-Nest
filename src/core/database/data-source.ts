import 'reflect-metadata';

import { configObj } from '@project/config';
import { DataSource } from 'typeorm';

const type = 'postgres';
export const AppDataSource = new DataSource({
  type: type,
  host: configObj[type].host_ext,
  port: configObj[type].port_ext,
  username: configObj[type].user,
  password: configObj[type].password,
  database: configObj[type].database,
  synchronize: true,
  logging: true,
  entities: ['src/*/entities/*.entity.ts'],
  migrations: ['src/database/migrations/*-migration.ts'],
});
//npx gulp --command "migrations:show"
