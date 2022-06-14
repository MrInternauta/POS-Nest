import { registerAs } from '@nestjs/config';
export default registerAs('config', () => ({
  database: {
    name: process.env.DATA_BASE,
    db_port: process.env.DATA_PORT,
  },
  api_key: process.env.API_KEY,
}));
