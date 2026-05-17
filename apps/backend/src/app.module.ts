import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { validateConfiguration } from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PointsModule } from './modules/points/points.module';
import { PickupRequestsModule } from './modules/pickup-requests/pickup-requests.module';
import { ReportsModule } from './modules/reports/reports.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

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
    UsersModule,
    AuthModule,
    PointsModule,
    PickupRequestsModule,
    ReportsModule,
    MarketplaceModule,
  ],
  providers: [
    // Semua endpoint default-nya wajib JWT, kecuali yang ditandai `@Public()`.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // RolesGuard ditempatkan setelah JwtAuthGuard supaya `req.user` sudah ada
    // ketika RolesGuard mengecek peran. Bila handler tidak punya `@Roles()`,
    // guard ini otomatis lolos.
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
