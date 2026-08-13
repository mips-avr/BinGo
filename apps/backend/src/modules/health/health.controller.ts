import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';

interface HealthResponse {
  status: 'ok' | 'degraded';
  /**
   * Commit yang benar-benar sedang berjalan.
   *
   * Tanpa ini, CD hanya bisa membuktikan bahwa "ada" backend yang sehat —
   * bukan bahwa backend yang sehat itu berisi kode yang barusan di-push.
   * Render menyuntikkan RENDER_GIT_COMMIT ke setiap deploy; di lingkungan lain
   * nilainya `unknown`, dan itu disebutkan apa adanya alih-alih dikarang.
   */
  commit: string;
  uptimeSeconds: number;
  checks: {
    database: 'ok' | 'down';
    postgis: 'ok' | 'down' | 'unknown';
  };
  timestamp: string;
}

const COMMIT =
  process.env.RENDER_GIT_COMMIT ??
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.GIT_COMMIT ??
  'unknown';

@ApiTags('Health')
@Public()
// Health check tidak boleh kena batas laju. Probe liveness/readiness datang
// dari alamat yang sama terus-menerus; bila suatu saat ia ditolak 429, sistem
// orkestrasi akan menyimpulkan aplikasi mati dan mematikan proses yang justru
// sedang sehat.
@SkipThrottle()
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOkResponse({ description: 'Mengembalikan status kesehatan aplikasi & dependensinya' })
  async check(): Promise<HealthResponse> {
    let database: 'ok' | 'down' = 'down';
    let postgis: 'ok' | 'down' | 'unknown' = 'unknown';

    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
      database = 'ok';

      const rows = await this.prisma.$queryRawUnsafe<Array<{ version: string }>>(
        'SELECT PostGIS_Version() AS version',
      );
      postgis = rows && rows.length > 0 ? 'ok' : 'down';
    } catch {
      // Database / PostGIS tidak tersedia. Status sudah ter-set default `down`.
    }

    const allHealthy = database === 'ok' && postgis === 'ok';
    return {
      status: allHealthy ? 'ok' : 'degraded',
      commit: COMMIT,
      uptimeSeconds: Math.round(process.uptime()),
      checks: { database, postgis },
      timestamp: new Date().toISOString(),
    };
  }
}
