import 'reflect-metadata';

import { DataSource } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { migration1655765888400 } from './migrations/1655765888400-migration';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5435,
  username: 'root',
  password: '123456',
  database: 'my_db',
  synchronize: false,
  logging: true,
  entities: [Product, User],
  migrations: [migration1655765888400],
  subscribers: [],
});
//npm run typeorm -- migration:generate src/database/migrations -d src/database/data-source.ts
