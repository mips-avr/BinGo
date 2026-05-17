import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateConfiguration } from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // Cari .env relatif terhadap akar paket backend agar bekerja baik saat
      // dijalankan dari root monorepo (`pnpm backend:dev`) maupun langsung di
      // dalam `apps/backend`.
      envFilePath: [
        join(process.cwd(), '.env'),
        join(__dirname, '..', '.env'),
        join(__dirname, '..', '..', '.env'),
      ],
      // Validasi lewat Zod (lihat config/configuration.ts). Bila tidak valid,
      // exception akan dilempar saat bootstrap.
      validate: validateConfiguration,
    }),
    PrismaModule,
    HealthModule,
  ],
})
export class AppModule {}
