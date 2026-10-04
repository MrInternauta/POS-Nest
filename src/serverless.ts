import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';

import * as express from 'express';
import { IncomingMessage, ServerResponse } from 'http';
//TypeORM loads the driver by a name it builds at runtime, which the Vercel bundler cannot follow
import 'pg';

import { AppModule } from './app.module';
import { configureApp } from './setup';

let server: Promise<express.Express> | undefined;

async function bootstrap() {
  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
  configureApp(app);
  await app.init();
  return expressApp;
}

/** Vercel entry: the app is built once per instance and reused by the requests that land on it */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  server ??= bootstrap().catch(error => {
    //A cold start that failed (the database was not reachable) must not stay cached for the next request
    server = undefined;
    throw error;
  });
  const app = await server;
  app(req as express.Request, res as express.Response);
}
