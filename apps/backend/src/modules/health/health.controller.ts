import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

interface HealthResponse {
  status: 'ok' | 'degraded';
  uptimeSeconds: number;
  checks: {
    database: 'ok' | 'down';
    postgis: 'ok' | 'down' | 'unknown';
  };
  timestamp: string;
}

@ApiTags('Health')
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
      uptimeSeconds: Math.round(process.uptime()),
      checks: { database, postgis },
      timestamp: new Date().toISOString(),
    };
  }
}
