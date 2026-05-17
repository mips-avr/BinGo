import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TransactionsService } from '../transactions.service';
import { PrismaService } from '../../../prisma/prisma.service';

interface MockItem {
  id: string;
  itemName: string;
  price: number;
  minOrderQty: number;
  stock: number;
}

function makeTx(items: Record<string, MockItem>) {
  const createdRows: Array<{ buyerId: string; itemId: string; qty: number; totalPrice: number }> = [];
  let txCounter = 0;
  return {
    marketplaceItem: {
      findUnique: jest.fn(async ({ where: { id } }: { where: { id: string } }) => items[id] ?? null),
      updateMany: jest.fn(async ({ where, data }: { where: { id: string; stock: { gte: number } }; data: { stock: { decrement: number } } }) => {
        const item = items[where.id];
        if (!item || item.stock < where.stock.gte) return { count: 0 };
        item.stock -= data.stock.decrement;
        return { count: 1 };
      }),
    },
    transaction: {
      create: jest.fn(async ({ data }: { data: { buyerId: string; itemId: string; qty: number; totalPrice: number } }) => {
        txCounter += 1;
        createdRows.push(data);
        return {
          id: `t${txCounter}`,
          ...data,
          status: 'PAID',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }),
    },
    __createdRows: createdRows,
  };
}

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: { $transaction: jest.Mock; transaction: { findMany: jest.Mock } };
  let txClient: ReturnType<typeof makeTx>;

  beforeEach(async () => {
    txClient = makeTx({});
    prisma = {
      $transaction: jest.fn(async (fn: (tx: unknown) => unknown) => fn(txClient)),
      transaction: { findMany: jest.fn() },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [TransactionsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(TransactionsService);
  });

  it('menjumlahkan total harga & mengurangi stok atomik per item', async () => {
    txClient = makeTx({
      i1: { id: 'i1', itemName: 'Kantong', price: 1500, minOrderQty: 100, stock: 1000 },
      i2: { id: 'i2', itemName: 'Sedotan', price: 500, minOrderQty: 50, stock: 200 },
    });
    prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(txClient));

    const res = await service.checkout('msme1', {
      items: [
        { itemId: 'i1', qty: 200 },
        { itemId: 'i2', qty: 100 },
      ],
    });

    expect(res.totalAmount).toBe(200 * 1500 + 100 * 500);
    expect(res.transactions).toHaveLength(2);
    expect(res.transactions.every((t) => t.status === 'PAID')).toBe(true);
  });

  it('menggabungkan duplikasi itemId di keranjang', async () => {
    txClient = makeTx({
      i1: { id: 'i1', itemName: 'Kantong', price: 1500, minOrderQty: 100, stock: 1000 },
    });
    prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(txClient));

    const res = await service.checkout('msme1', {
      items: [
        { itemId: 'i1', qty: 100 },
        { itemId: 'i1', qty: 100 },
      ],
    });
    // Hanya satu transaksi (gabungan 200) yang dibuat
    expect(res.transactions).toHaveLength(1);
    expect(res.transactions[0]?.qty).toBe(200);
  });

  it('menolak qty di bawah minOrderQty', async () => {
    txClient = makeTx({
      i1: { id: 'i1', itemName: 'Kantong', price: 1500, minOrderQty: 100, stock: 1000 },
    });
    prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(txClient));

    await expect(
      service.checkout('msme1', { items: [{ itemId: 'i1', qty: 50 }] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('melempar NotFound bila produk tidak ada', async () => {
    txClient = makeTx({});
    prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(txClient));
    await expect(
      service.checkout('msme1', { items: [{ itemId: 'nope', qty: 1 }] }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('melempar Conflict bila stok tidak cukup (race-safe)', async () => {
    txClient = makeTx({
      i1: { id: 'i1', itemName: 'Kantong', price: 1500, minOrderQty: 100, stock: 100 },
    });
    prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(txClient));
    await expect(
      service.checkout('msme1', { items: [{ itemId: 'i1', qty: 500 }] }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
