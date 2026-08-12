import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import { AppModule } from '../src/app.module';

const server = express();
let cachedApp: any;

export default async function handler(req: any, res: any) {
  if (!cachedApp) {
    // Kita bungkus NestJS ke dalam instance Express
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
    app.enableCors(); // Sangat penting agar frontend web tidak terkena CORS
    await app.init();
    cachedApp = server;
  }
  return cachedApp(req, res);
}