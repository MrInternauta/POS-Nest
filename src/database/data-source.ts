import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { configObj } from 'src/config';

const type = 'postgres';
export const AppDataSource = new DataSource({
  type: type,
  host: configObj[type].host_ext,
  port: configObj[type].port_ext,
  username: configObj[type].user,
  password: configObj[type].password,
  database: configObj[type].database,
  synchronize: false,
  logging: true,
  entities: ['src/*/entities/*.entity.ts'],
  migrations: ['src/database/migrations/*-migration.ts'],
});
//npx gulp --command "migrations:show"
