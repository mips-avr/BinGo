/**
 * Seed Phase 3 — mengisi katalog WasteMart dengan contoh kemasan ramah
 * lingkungan dari supplier UMKM. Idempoten: re-run aman (cek by itemName).
 */
import { config as loadDotEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';

for (const p of [resolve(__dirname, '../.env'), resolve(__dirname, '../../../.env')]) {
  if (existsSync(p)) {
    loadDotEnv({ path: p });
    break;
  }
}

const prisma = new PrismaClient();

const SEED_ITEMS = [
  {
    supplierName: 'CV Hijau Lestari',
    itemName: 'Kantong kraft food-grade 30x40 cm',
    description:
      'Kantong kertas kraft food-grade tahan minyak, cocok untuk usaha kuliner. Dapat didaur ulang.',
    price: 1500,
    minOrderQty: 100,
    stock: 5000,
    imageUrl: null,
  },
  {
    supplierName: 'UD Bumi Bersih',
    itemName: 'Sedotan bambu reusable 21 cm',
    description: 'Sedotan bambu organik, dapat dicuci & dipakai berulang. Pengganti sedotan plastik.',
    price: 2500,
    minOrderQty: 50,
    stock: 2000,
    imageUrl: null,
  },
  {
    supplierName: 'CV Daur Mandiri',
    itemName: 'Kotak makan bagasse 750 ml',
    description: 'Kotak makan dari ampas tebu, mudah terurai 90 hari. Aman microwave & oven.',
    price: 1750,
    minOrderQty: 200,
    stock: 3000,
    imageUrl: null,
  },
  {
    supplierName: 'PT Eco Wraps Nusantara',
    itemName: 'Beeswax wrap pengganti plastik (3 ukuran)',
    description:
      'Pembungkus makanan dari kain katun + lilin lebah. Reusable hingga 1 tahun, bebas plastik sekali pakai.',
    price: 75000,
    minOrderQty: 5,
    stock: 200,
    imageUrl: null,
  },
];

async function main(): Promise<void> {
  for (const item of SEED_ITEMS) {
    const existing = await prisma.marketplaceItem.findFirst({
      where: { itemName: item.itemName },
    });
    if (existing) {
      // eslint-disable-next-line no-console
      console.log(`✓ sudah ada: ${item.itemName}`);
      continue;
    }
    await prisma.marketplaceItem.create({ data: item });
    // eslint-disable-next-line no-console
    console.log(`+ tambah: ${item.itemName}`);
  }
  // eslint-disable-next-line no-console
  console.log(`\nSeed selesai. Total ${SEED_ITEMS.length} produk siap di WasteMart.`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
