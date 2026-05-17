import { Injectable, NotFoundException } from '@nestjs/common';
import type { MarketplaceItem } from '@prisma/client';
import type { MarketplaceItemDto } from '@bingo/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateItemDto } from './dto/create-item.dto';

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(search?: string): Promise<MarketplaceItemDto[]> {
    const where = search
      ? {
          OR: [
            { itemName: { contains: search, mode: 'insensitive' as const } },
            { supplierName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : undefined;
    const rows = await this.prisma.marketplaceItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((r) => this.toDto(r));
  }

  async getById(id: string): Promise<MarketplaceItemDto> {
    const item = await this.prisma.marketplaceItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Produk tidak ditemukan');
    return this.toDto(item);
  }

  async create(dto: CreateItemDto): Promise<MarketplaceItemDto> {
    const item = await this.prisma.marketplaceItem.create({
      data: {
        supplierName: dto.supplierName.trim(),
        itemName: dto.itemName.trim(),
        description: dto.description.trim(),
        price: dto.price,
        minOrderQty: dto.minOrderQty,
        stock: dto.stock ?? 0,
        imageUrl: dto.imageUrl ?? null,
      },
    });
    return this.toDto(item);
  }

  private toDto(i: MarketplaceItem): MarketplaceItemDto {
    return {
      id: i.id,
      supplierName: i.supplierName,
      itemName: i.itemName,
      description: i.description,
      price: i.price,
      minOrderQty: i.minOrderQty,
      stock: i.stock,
      imageUrl: i.imageUrl,
      createdAt: i.createdAt.toISOString(),
    };
  }
}
