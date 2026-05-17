import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Sumber TrashLink Points (untuk audit & UI ringkasan di masa depan).
 * Phase 3 belum menyimpan log per transaksi — hanya menaikkan
 * `users.points_balance` secara atomik. Phase berikutnya bisa menambahkan
 * tabel `points_ledger` tanpa breaking change.
 */
export const PointsSource = {
  REPORT_VERIFIED: 'REPORT_VERIFIED',
  PICKUP_COMPLETED: 'PICKUP_COMPLETED',
} as const;
export type PointsSource = (typeof PointsSource)[keyof typeof PointsSource];

const DEFAULT_AMOUNTS: Record<PointsSource, number> = {
  REPORT_VERIFIED: 50,
  PICKUP_COMPLETED: 25,
};

@Injectable()
export class PointsService {
  private readonly logger = new Logger(PointsService.name);
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Menambah saldo `pointsBalance` user secara atomik (single UPDATE) lalu
   * mengembalikan saldo baru. Tahan dijalankan dalam transaksi: jika
   * `tx` diberikan, akan ikut bagian dari transaksi tersebut.
   */
  async award(
    userId: string,
    source: PointsSource,
    amount: number = DEFAULT_AMOUNTS[source],
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    if (amount <= 0) return 0;
    const client = tx ?? this.prisma;
    const updated = await client.user.update({
      where: { id: userId },
      data: { pointsBalance: { increment: amount } },
      select: { pointsBalance: true },
    });
    this.logger.log(`+${amount} poin ke user=${userId} (sumber=${source})`);
    return updated.pointsBalance;
  }
}
