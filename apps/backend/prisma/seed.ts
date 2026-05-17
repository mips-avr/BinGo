/**
 * Seed minimal untuk Phase 1.
 * Dijalankan via `pnpm --filter @bingo/backend prisma:seed`.
 *
 * Phase berikutnya (Auth & Marketplace) akan menambahkan user contoh,
 * pemulung, dan katalog WasteMart.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('Seed Phase 1 belum mengisi data apa pun (struktur skema sudah siap).');
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
