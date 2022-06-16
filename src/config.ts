import { registerAs } from '@nestjs/config';
export default registerAs('config', () => ({
  api_key: process.env.API_KEY,
  database: {
    name: process.env.DATA_BASE,
    db_port: process.env.DATA_PORT,
  },
  postgres: {
    database: process.env.POSTGRES_DB,
    database_user: process.env.POSTGRES_USER,
    database_password: process.env.POSTGRES_PASSWORD,
    database_port: parseInt(process.env.POSTGRES_PORT, 10),
    database_host: process.env.POSTGRES_HOST,
  },
}));
