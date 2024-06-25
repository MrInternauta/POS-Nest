import { registerAs } from '@nestjs/config';

import * as dotenv from 'dotenv';

dotenv.config();

export const configObj = {
  api_key: process.env.API_KEY,
  postgres: {
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    port: parseInt(process.env.POSTGRES_PORT, 10),
    host: process.env.POSTGRES_HOST,
    host_external: process.env.POSTGRES_HOST_EXTERNAL,
    port_external: parseInt(process.env.POSTGRES_PORT_EXTERNAL, 10),
  },
  jwt_secret: process.env.JWT_SECRET,
  jwt_expires_in: process.env.JWT_EXPIRES_IN,
  IMAGES_PATH: process.env.IMAGES_PATH,
};
export const config = registerAs('config', () => {
  console.log(configObj);
  return configObj;
});
