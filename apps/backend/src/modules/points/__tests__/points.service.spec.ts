import { Test } from '@nestjs/testing';
import { PointsService, PointsSource } from '../points.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('PointsService', () => {
  let service: PointsService;
  let prisma: { user: { update: jest.Mock } };

  beforeEach(async () => {
    prisma = { user: { update: jest.fn() } };
    const moduleRef = await Test.createTestingModule({
      providers: [PointsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(PointsService);
  });

  it('menambahkan poin standar untuk REPORT_VERIFIED (50)', async () => {
    prisma.user.update.mockResolvedValue({ pointsBalance: 75 });
    const balance = await service.award('u1', PointsSource.REPORT_VERIFIED);
    expect(balance).toBe(75);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { pointsBalance: { increment: 50 } },
      select: { pointsBalance: true },
    });
  });

  it('menambahkan poin standar untuk PICKUP_COMPLETED (25)', async () => {
    prisma.user.update.mockResolvedValue({ pointsBalance: 25 });
    await service.award('u1', PointsSource.PICKUP_COMPLETED);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { pointsBalance: { increment: 25 } },
      select: { pointsBalance: true },
    });
  });

  it('mengabaikan jumlah <= 0 tanpa memanggil DB', async () => {
    const balance = await service.award('u1', PointsSource.PICKUP_COMPLETED, 0);
    expect(balance).toBe(0);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('menggunakan tx client jika diberikan', async () => {
    const txUpdate = jest.fn().mockResolvedValue({ pointsBalance: 100 });
    const tx = { user: { update: txUpdate } } as never;
    await service.award('u1', PointsSource.REPORT_VERIFIED, 50, tx);
    expect(txUpdate).toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
