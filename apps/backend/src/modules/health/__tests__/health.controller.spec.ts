import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../health.controller';
import { PrismaService } from '../../../prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: { $queryRawUnsafe: jest.Mock };

  beforeEach(async () => {
    prisma = {
      $queryRawUnsafe: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();

    controller = moduleRef.get(HealthController);
  });

  it('mengembalikan status ok bila database & PostGIS sehat', async () => {
    prisma.$queryRawUnsafe
      .mockResolvedValueOnce([{ '?column?': 1 }])
      .mockResolvedValueOnce([{ version: '3.4 USE_GEOS=1' }]);

    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(result.checks.database).toBe('ok');
    expect(result.checks.postgis).toBe('ok');
    expect(typeof result.uptimeSeconds).toBe('number');
  });

  it('mengembalikan status degraded bila database error', async () => {
    prisma.$queryRawUnsafe.mockRejectedValueOnce(new Error('connection refused'));

    const result = await controller.check();

    expect(result.status).toBe('degraded');
    expect(result.checks.database).toBe('down');
  });

  it('mengembalikan status degraded bila PostGIS tidak tersedia', async () => {
    prisma.$queryRawUnsafe
      .mockResolvedValueOnce([{ '?column?': 1 }])
      .mockRejectedValueOnce(new Error('function postgis_version() does not exist'));

    const result = await controller.check();

    expect(result.status).toBe('degraded');
    expect(result.checks.database).toBe('ok');
    expect(result.checks.postgis).toBe('unknown');
  });
});
