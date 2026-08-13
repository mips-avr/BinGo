import { RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { UPLOADS_DIR, USES_BLOB_STORAGE } from './modules/uploads/uploads.constants';

/**
 * Konfigurasi aplikasi yang dipakai BERSAMA oleh dua entry point.
 *
 * `main.ts` menjalankan server yang mendengarkan port — dipakai saat
 * pengembangan lokal dan di dalam Docker. `serverless.ts` tidak pernah
 * mendengarkan port sama sekali, karena di Vercel yang memanggil aplikasi
 * adalah runtime-nya, bukan soket.
 *
 * Sebelumnya seluruh konfigurasi ini menempel di `main.ts` bersama
 * `app.listen()`, sehingga tidak ada cara memakainya tanpa ikut membuka port —
 * dan itulah sebabnya backend tidak pernah benar-benar jalan di Vercel.
 */
export function configureApp(app: NestExpressApplication): void {
  // CORP dimatikan supaya <Image src="..."> dapat memuat foto dari domain
  // backend yang berbeda dari domain web.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  /*
   * Daftar origin dibaca dari CORS_ORIGINS (dipisah koma).
   *
   * Bila tidak diset, origin dipantulkan apa adanya — perilaku lama, supaya
   * tidak ada yang mendadak rusak saat variabel belum sempat dipasang. Tetapi
   * di produksi itu berarti situs mana pun boleh memanggil API ini dengan
   * kredensial pengguna, jadi peringatannya dicetak keras agar tidak terlewat.
   */
  const allowed = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (allowed.length > 0) {
    app.enableCors({
      origin: (origin, cb) => {
        // Permintaan tanpa Origin (curl, health check, aplikasi native) selalu
        // diloloskan: CORS adalah pengaman peramban, bukan autentikasi.
        if (!origin || allowed.includes(origin)) return cb(null, true);
        return cb(null, false);
      },
      credentials: true,
    });
  } else {
    if (process.env.NODE_ENV === 'production') {
      // eslint-disable-next-line no-console
      console.warn(
        '[CORS] CORS_ORIGINS kosong di produksi — origin mana pun akan dipantulkan. ' +
          'Setel CORS_ORIGINS ke daftar domain web Anda.',
      );
    }
    app.enableCors({ origin: true, credentials: true });
  }

  // Pada Vercel, foto dilayani langsung dari Vercel Blob. Static assets hanya
  // dipasang untuk pengembangan lokal atau deployment dengan volume permanen —
  // sistem berkas serverless bersifat sementara dan sebagian besar read-only.
  if (!USES_BLOB_STORAGE) {
    app.useStaticAssets(UPLOADS_DIR, { prefix: '/uploads/' });
  }

  // /health sengaja di root (tanpa prefix /api dan tanpa versi) agar mudah
  // dipakai sebagai liveness probe.
  app.setGlobalPrefix('api', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1', prefix: 'v' });

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
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));
  }
}
