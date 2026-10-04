import { registerAs } from '@nestjs/config';

import * as dotenv from 'dotenv';

dotenv.config();

export const configObj = {
  api_key: process.env.API_KEY,
  postgres: {
    //A hosted database (Neon, Supabase) hands out one connection string instead of the separate values below
    url: process.env.DATABASE_URL,
    //The migrations go through the direct connection, the pooled one does not hold the locks they take
    migrations_url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
    ssl: process.env.POSTGRES_SSL === 'true',
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
  IMAGES_PATH: process.env.IMAGES_PATH || 'files/images',
  //When it is set the images go to Vercel Blob, the disk of a serverless function does not keep them
  blob_token: process.env.BLOB_READ_WRITE_TOKEN,
};
export const config = registerAs('config', () => configObj);
