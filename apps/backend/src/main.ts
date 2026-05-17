import 'reflect-metadata';
import { Logger, RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { UPLOADS_DIR } from './modules/uploads/uploads.constants';

/**
 * Entry point aplikasi BinGo API.
 * - Mengaktifkan validasi global (class-validator) untuk semua DTO.
 * - Memasang helmet untuk header keamanan dasar.
 * - Mendaftarkan filter exception global agar respons error konsisten.
 * - Mengaktifkan Swagger di `/docs` (development saja).
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'warn', 'error', 'debug'],
  });

  // Disable CORP supaya `<Image src="...">` di Expo dapat memuat foto
  // dari `/uploads/...` di domain backend (dev: localhost).
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.enableCors({ origin: true, credentials: true });

  app.useStaticAssets(UPLOADS_DIR, { prefix: '/uploads/' });

  // Endpoint /health sengaja diletakkan di root (tanpa prefix /api dan tanpa
  // versi) agar mudah dipakai sebagai liveness/readiness probe.
  app.setGlobalPrefix('api', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('BinGo API')
      .setDescription('API untuk aplikasi pengelolaan sampah BinGo')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  const port = Number(process.env.BACKEND_PORT ?? 3000);
  await app.listen(port);
  logger.log(`BinGo API berjalan di http://localhost:${port}`);
  logger.log(`Dokumentasi Swagger: http://localhost:${port}/docs`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Gagal mem-bootstrap aplikasi:', err);
  process.exit(1);
});
