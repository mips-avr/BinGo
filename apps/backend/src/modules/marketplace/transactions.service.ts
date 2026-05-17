import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Transaction } from '@prisma/client';
import type { TransactionDto, TransactionStatus as TxStatus } from '@bingo/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import type { CartItemDto, CheckoutDto } from './dto/checkout.dto';

export interface CheckoutResult {
  transactions: TransactionDto[];
  totalAmount: number;
}

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Checkout (mock-payment) untuk MVP.
   * Setiap item keranjang menjadi 1 baris `Transaction`. Stok produk
   * dikurangi secara atomik di dalam transaksi DB — jika ada satu item
   * yang stoknya kurang, seluruh checkout di-rollback.
   */
  async checkout(buyerId: string, dto: CheckoutDto): Promise<CheckoutResult> {
    if (dto.items.length === 0) {
      throw new BadRequestException('Keranjang tidak boleh kosong');
    }

    const consolidated = this.consolidate(dto.items);

    return this.prisma.$transaction(async (tx) => {
      const transactions: TransactionDto[] = [];
      let totalAmount = 0;

      for (const cartItem of consolidated) {
        const item = await tx.marketplaceItem.findUnique({ where: { id: cartItem.itemId } });
        if (!item) {
          throw new NotFoundException(`Produk ${cartItem.itemId} tidak ditemukan`);
        }
        if (cartItem.qty < item.minOrderQty) {
          throw new BadRequestException(
            `Minimal pesanan untuk "${item.itemName}" adalah ${item.minOrderQty}`,
          );
        }
        // Decrement stok secara atomik dengan whereClause yang mencegah
        // stok negatif (race-safe terhadap pembeli paralel).
        const updated = await tx.marketplaceItem.updateMany({
          where: { id: item.id, stock: { gte: cartItem.qty } },
          data: { stock: { decrement: cartItem.qty } },
        });
        if (updated.count === 0) {
          throw new ConflictException(
            `Stok "${item.itemName}" tidak cukup (tersisa ${item.stock})`,
          );
        }

        const total = item.price * cartItem.qty;
        totalAmount += total;

        const trx = await tx.transaction.create({
          data: {
            buyerId,
            itemId: item.id,
            qty: cartItem.qty,
            totalPrice: total,
            status: 'PAID', // mock payment langsung paid
          },
        });
        transactions.push(this.toDto(trx));
      }

      return { transactions, totalAmount };
    });
  }

  async listMine(buyerId: string): Promise<TransactionDto[]> {
    const rows = await this.prisma.transaction.findMany({
      where: { buyerId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((r) => this.toDto(r));
  }

  // Menggabungkan duplikasi itemId di keranjang.
  private consolidate(items: CartItemDto[]): CartItemDto[] {
    const map = new Map<string, number>();
    for (const item of items) {
      map.set(item.itemId, (map.get(item.itemId) ?? 0) + item.qty);
    }
    return Array.from(map.entries()).map(([itemId, qty]) => ({ itemId, qty }));
  }

  private toDto(t: Transaction): TransactionDto {
    return {
      id: t.id,
      buyerId: t.buyerId,
      itemId: t.itemId,
      qty: t.qty,
      totalPrice: t.totalPrice,
      status: t.status as TxStatus,
      createdAt: t.createdAt.toISOString(),
    };
  }
}
