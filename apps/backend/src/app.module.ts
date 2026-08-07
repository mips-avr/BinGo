import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { validateConfiguration } from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AgentVerificationsModule } from './modules/agent-verifications/agent-verifications.module';
import { PointsModule } from './modules/points/points.module';
import { PickupRequestsModule } from './modules/pickup-requests/pickup-requests.module';
import { ReportsModule } from './modules/reports/reports.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { WeighingReceiptsModule } from './modules/weighing-receipts/weighing-receipts.module';
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
    // Batas laju bawaan untuk seluruh endpoint. Longgar dengan sengaja:
    // tugasnya hanya menahan penyalahgunaan kasar, bukan mengganggu pemakaian
    // wajar. Endpoint yang mahal atau sensitif menurunkan batasnya sendiri
    // lewat `@Throttle(...)` — lihat AuthController.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 300 }]),
    PrismaModule,
    HealthModule,
    UsersModule,
    AuthModule,
    AgentVerificationsModule,
    PointsModule,
    PickupRequestsModule,
    ReportsModule,
    MarketplaceModule,
    UploadsModule,
    WeighingReceiptsModule,
  ],
  providers: [
    // ThrottlerGuard didaftarkan PALING AWAL supaya permintaan yang melewati
    // batas ditolak sebelum guard lain bekerja. Menaruhnya setelah JwtAuthGuard
    // berarti setiap permintaan banjir tetap membayar verifikasi token dan
    // kueri pengguna terlebih dahulu — persis biaya yang ingin dihindari.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Semua endpoint default-nya wajib JWT, kecuali yang ditandai `@Public()`.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // RolesGuard ditempatkan setelah JwtAuthGuard supaya `req.user` sudah ada
    // ketika RolesGuard mengecek peran. Bila handler tidak punya `@Roles()`,
    // guard ini otomatis lolos.
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
