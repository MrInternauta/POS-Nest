import 'reflect-metadata';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5435,
  username: 'root',
  password: '123456',
  database: 'my_db',
  synchronize: false,
  logging: true,
  entities: ['src/*/entities/*.entity.ts'],
  migrations: ['src/database/migrations/*-migration.ts'],
  logger: 'advanced-console',
});
