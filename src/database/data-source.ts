import 'reflect-metadata';
// import { enviroments } from '../enviroments';
import { DataSource } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
// import dotenv from 'dotenv';
// import path from 'path';

// const fileEnv = enviroments[process?.env?.NODE_ENV] || '.env';

// const config = dotenv.config({
//   path: path.resolve('./', fileEnv),
// });
// console.log('HOLAA', config);

// console.log(config);
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
  migrations: [],
  subscribers: [],
});
//npm run typeorm -- migration:generate src/database/migrations -d src/database/data-source.ts
