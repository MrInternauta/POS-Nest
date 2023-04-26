import { registerAs } from '@nestjs/config';

export const configObj = {
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
    port_ext: parseInt(process.env.POSTGRES_PORT_EXTERNAL, 10),
    host_ext: process.env.POSTGRES_HOST_EXTERNAL,
  },
  mysql: {
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_ROOT_PASSWORD,
    port: parseInt(process.env.MYSQL_PORT, 10),
    host: process.env.MYSQL_HOST,
  },
  mssql: {
    database: process.env.SQLSERVER_DATABASE,
    user: process.env.SQLSERVER_USER,
    password: process.env.SQLSERVER_SA_PASSWORD,
    port: parseInt(process.env.SQLSERVER_PORT, 10),
    host: process.env.SQLSERVER_HOST,
  },
  jwt_secret: process.env.JWT_SECRET,
  jwt_expires_in: process.env.JWT_EXPIRES_IN,
};
export const config = registerAs('config', () => configObj);
