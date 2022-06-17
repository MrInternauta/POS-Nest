import { registerAs } from '@nestjs/config';
export default registerAs('config', () => ({
  api_key: process.env.API_KEY,
  database: {
    name: process.env.DATA_BASE,
    db_port: process.env.DATA_PORT,
  },
  postgres: {
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    port: parseInt(process.env.POSTGRES_PORT, 10),
    host: process.env.POSTGRES_HOST,
  },
  mysql: {
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_ROOT_PASSWORD,
    port: parseInt(process.env.MYSQL_PORT, 10),
    host: process.env.MYSQL_HOST,
  },
}));
