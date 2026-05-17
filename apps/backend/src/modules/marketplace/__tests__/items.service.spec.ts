import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ItemsService } from '../items.service';
import { PrismaService } from '../../../prisma/prisma.service';

function itemRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'i1',
    supplierName: 'CV Hijau Lestari',
    itemName: 'Kantong kraft 30x40',
    description: 'Kantong kertas',
    price: 1500,
    minOrderQty: 100,
    stock: 5000,
    imageUrl: null,
    createdAt: new Date('2026-05-17T00:00:00Z'),
    updatedAt: new Date(),
    ...overrides,
  } as never;
}

describe('ItemsService', () => {
  let service: ItemsService;
  let prisma: {
    marketplaceItem: { findMany: jest.Mock; findUnique: jest.Mock; create: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      marketplaceItem: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [ItemsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(ItemsService);
  });

  it('list tanpa filter mengembalikan DTO terbaru', async () => {
    prisma.marketplaceItem.findMany.mockResolvedValue([itemRow(), itemRow({ id: 'i2' })]);
    const res = await service.list();
    expect(res).toHaveLength(2);
    expect(res[0]?.itemName).toBe('Kantong kraft 30x40');
  });

  it('list dengan search menggunakan case-insensitive OR', async () => {
    prisma.marketplaceItem.findMany.mockResolvedValue([]);
    await service.list('hijau');
    expect(prisma.marketplaceItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { itemName: { contains: 'hijau', mode: 'insensitive' } },
            { supplierName: { contains: 'hijau', mode: 'insensitive' } },
          ],
        },
      }),
    );
  });

  it('create menyimpan stok default 0 bila tidak diberikan', async () => {
    prisma.marketplaceItem.create.mockResolvedValue(itemRow({ stock: 0 }));
    await service.create({
      supplierName: 'CV Hijau',
      itemName: 'Kantong',
      description: 'desc',
      price: 1500,
      minOrderQty: 100,
    });
    expect(prisma.marketplaceItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ stock: 0, imageUrl: null }),
    });
  });

  it('getById melempar NotFound jika tidak ada', async () => {
    prisma.marketplaceItem.findUnique.mockResolvedValue(null);
    await expect(service.getById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
