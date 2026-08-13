import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import { configureApp } from './app.factory';

/**
 * Entry point untuk server yang mendengarkan port: pengembangan lokal dan
 * Docker. Vercel TIDAK memakai berkas ini — lihat `serverless.ts`.
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'warn', 'error', 'debug'],
  });

  configureApp(app);

  const port = Number(process.env.PORT ?? process.env.BACKEND_PORT ?? 3000);
  await app.listen(port);
  logger.log(`BinGo API berjalan di http://localhost:${port}`);
  logger.log(`Dokumentasi Swagger: http://localhost:${port}/docs`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Gagal mem-bootstrap aplikasi:', err);
  process.exit(1);
});
