/**
 * Seed komprehensif BinGo MVP demo.
 *
 * Mengisi:
 * - 3 demo users (Warga, Pemulung, UMKM) dengan password `demo12345678`
 * - 4 produk WasteMart (kemasan ramah lingkungan)
 * - 6 pickup requests (berbagai status)
 * - 4 reports (berbagai status)
 * - 3 transaksi UMKM
 *
 * Idempoten — aman dijalankan ulang (cek by phone/itemName).
 */
import { config as loadDotEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

for (const p of [resolve(__dirname, '../.env'), resolve(__dirname, '../../../.env')]) {
  if (existsSync(p)) {
    loadDotEnv({ path: p });
    break;
  }
}

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'demo12345678';
const BCRYPT_ROUNDS = 10;

// ─── Demo Users ──────────────────────────────────────────────

const DEMO_USERS = [
  {
    name: 'Budi Santoso',
    phone: '+6281111111111',
    role: 'CITIZEN' as const,
    nik: '3171012501900001',
    pointsBalance: 75,
  },
  {
    name: 'Agus Pramono',
    phone: '+6282222222222',
    role: 'WASTE_AGENT' as const,
    nik: '3171011507880002',
    pointsBalance: 0,
  },
  {
    name: 'Siti Rahayu',
    phone: '+6283333333333',
    role: 'MSME' as const,
    nik: null,
    pointsBalance: 0,
  },
];

// ─── WasteMart Products ─────────────────────────────────────

const SEED_ITEMS = [
  {
    supplierName: 'CV Hijau Lestari',
    itemName: 'Kantong kraft food-grade 30x40 cm',
    description:
      'Kantong kertas kraft food-grade tahan minyak, cocok untuk usaha kuliner. Dapat didaur ulang.',
    price: 1500,
    minOrderQty: 100,
    stock: 5000,
    imageUrl: 'https://picsum.photos/seed/bingomart1/800/600',
  },
  {
    supplierName: 'UD Bumi Bersih',
    itemName: 'Sedotan bambu reusable 21 cm',
    description: 'Sedotan bambu organik, dapat dicuci & dipakai berulang. Pengganti sedotan plastik.',
    price: 2500,
    minOrderQty: 50,
    stock: 2000,
    imageUrl: 'https://picsum.photos/seed/bingomart2/800/600',
  },
  {
    supplierName: 'CV Daur Mandiri',
    itemName: 'Kotak makan bagasse 750 ml',
    description: 'Kotak makan dari ampas tebu, mudah terurai 90 hari. Aman microwave & oven.',
    price: 1750,
    minOrderQty: 200,
    stock: 3000,
    imageUrl: 'https://picsum.photos/seed/bingomart3/800/600',
  },
  {
    supplierName: 'PT Eco Wraps Nusantara',
    itemName: 'Beeswax wrap pengganti plastik (3 ukuran)',
    description:
      'Pembungkus makanan dari kain katun + lilin lebah. Reusable hingga 1 tahun, bebas plastik sekali pakai.',
    price: 75000,
    minOrderQty: 5,
    stock: 200,
    imageUrl: 'https://picsum.photos/seed/bingomart4/800/600',
  },
];

// ─── Pickup Requests (Jakarta area) ─────────────────────────

const PICKUP_REQUESTS = [
  {
    status: 'PENDING' as const,
    lat: -6.2088,
    lng: 106.8456,
    address: 'Jl. Sudirman Kav. 52-53, Jakarta Pusat',
    materialType: 'PET' as const,
    estimatedWeightKg: 3.5,
    notes: 'Botol air mineral bekas, sudah dicuci.',
  },
  {
    status: 'PENDING' as const,
    lat: -6.1751,
    lng: 106.827,
    address: 'Jl. Kemang Raya No. 18, Jakarta Selatan',
    materialType: 'PAPER' as const,
    estimatedWeightKg: 8.0,
    notes: 'Kardus bekas belanja online, sudah dilipat rapi.',
  },
  {
    status: 'ACCEPTED' as const,
    lat: -6.2297,
    lng: 106.6895,
    address: 'Jl. Meruya Ilir No. 7, Jakarta Barat',
    materialType: 'METAL' as const,
    estimatedWeightKg: 5.0,
    notes: 'Kaleng minuman dan tutup botol.',
    needAgent: true,
  },
  {
    status: 'COMPLETED' as const,
    lat: -6.1862,
    lng: 106.8348,
    address: 'Jl. Menteng Raya No. 31, Jakarta Pusat',
    materialType: 'HDPE' as const,
    estimatedWeightKg: 2.0,
    notes: null,
    needAgent: true,
  },
  {
    status: 'COMPLETED' as const,
    lat: -6.2383,
    lng: 106.7942,
    address: 'Jl. Pesanggrahan Raya, Jakarta Selatan',
    materialType: 'GLASS' as const,
    estimatedWeightKg: 6.5,
    notes: 'Botol kaca bekas sirup, hati-hati pecah.',
    needAgent: true,
  },
  {
    status: 'CANCELLED' as const,
    lat: -6.1475,
    lng: 106.8694,
    address: 'Jl. Kelapa Gading Boul., Jakarta Utara',
    materialType: 'MIXED' as const,
    estimatedWeightKg: 1.5,
    notes: 'Batal — sampah sudah diambil petugas RT.',
  },
];

// ─── Reports ────────────────────────────────────────────────

const SEED_REPORTS = [
  {
    status: 'DILAPORKAN' as const,
    lat: -6.2146,
    lng: 106.8451,
    description: 'Tumpukan sampah plastik di pinggir sungai Ciliwung dekat jembatan.',
    imageUrl: 'https://picsum.photos/seed/bingoreport1/800/600',
    verificationCount: 1,
  },
  {
    status: 'DILAPORKAN' as const,
    lat: -6.1944,
    lng: 106.823,
    description: 'Kantong sampah dibuang di trotoar depan minimarket, mengganggu pejalan kaki.',
    imageUrl: 'https://picsum.photos/seed/bingoreport2/800/600',
    verificationCount: 0,
  },
  {
    status: 'DIVERIFIKASI' as const,
    lat: -6.2408,
    lng: 106.7984,
    description: 'Pembuangan limbah konstruksi ilegal di lahan kosong RT 05.',
    imageUrl: 'https://picsum.photos/seed/bingoreport3/800/600',
    verificationCount: 3,
  },
  {
    status: 'SELESAI' as const,
    lat: -6.1753,
    lng: 106.8278,
    description: 'Sampah organik pasar yang menumpuk, sudah dibersihkan petugas DLH.',
    imageUrl: 'https://picsum.photos/seed/bingoreport4/800/600',
    verificationCount: 4,
  },
];

// ─── Main ───────────────────────────────────────────────────

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('🌱 Memulai seeding BinGo MVP demo...\n');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);

  // --- Users ---
  const userMap: Record<string, string> = {};
  for (const u of DEMO_USERS) {
    let existing = await prisma.user.findUnique({ where: { phone: u.phone } });
    if (!existing) {
      existing = await prisma.user.create({
        data: {
          name: u.name,
          phone: u.phone,
          role: u.role,
          nik: u.nik,
          passwordHash,
          pointsBalance: u.pointsBalance,
        },
      });
      // eslint-disable-next-line no-console
      console.log(`+ user: ${u.name} (${u.role})`);
    } else {
      // Update points balance on re-run
      await prisma.user.update({
        where: { id: existing.id },
        data: { pointsBalance: u.pointsBalance },
      });
      // eslint-disable-next-line no-console
      console.log(`✓ user sudah ada: ${u.name} (${u.role})`);
    }
    userMap[u.role] = existing.id;
  }

  const citizenId = userMap['CITIZEN'];
  const agentId = userMap['WASTE_AGENT'];
  const msmeId = userMap['MSME'];

  // --- Marketplace Items ---
  const itemIds: string[] = [];
  for (const item of SEED_ITEMS) {
    let existing = await prisma.marketplaceItem.findFirst({
      where: { itemName: item.itemName },
    });
    if (!existing) {
      existing = await prisma.marketplaceItem.create({ data: item });
      // eslint-disable-next-line no-console
      console.log(`+ produk: ${item.itemName}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`✓ produk sudah ada: ${item.itemName}`);
    }
    itemIds.push(existing.id);
  }

  // --- Pickup Requests ---
  const existingPickupsCount = await prisma.pickupRequest.count({
    where: { citizenId },
  });
  if (existingPickupsCount === 0) {
    for (const p of PICKUP_REQUESTS) {
      const { needAgent, ...rest } = p as typeof p & { needAgent?: boolean };
      await prisma.pickupRequest.create({
        data: {
          ...rest,
          citizenId,
          agentId: needAgent ? agentId : null,
        },
      });
      // eslint-disable-next-line no-console
      console.log(`+ pickup: ${rest.address} [${rest.status}]`);
    }
  } else {
    // eslint-disable-next-line no-console
    console.log(`✓ pickup requests sudah ada (${existingPickupsCount} baris)`);
  }

  // --- Reports ---
  const existingReportsCount = await prisma.report.count({
    where: { citizenId },
  });
  if (existingReportsCount === 0) {
    for (const r of SEED_REPORTS) {
      await prisma.report.create({
        data: {
          ...r,
          citizenId,
        },
      });
      // eslint-disable-next-line no-console
      console.log(`+ laporan: ${r.description?.slice(0, 40)}... [${r.status}]`);
    }
  } else {
    // eslint-disable-next-line no-console
    console.log(`✓ reports sudah ada (${existingReportsCount} baris)`);
  }

  // --- Transactions (MSME) ---
  const existingTxCount = await prisma.transaction.count({
    where: { buyerId: msmeId },
  });
  if (existingTxCount === 0 && itemIds.length >= 3) {
    const txData = [
      { itemId: itemIds[0], qty: 200, totalPrice: 200 * 1500, status: 'COMPLETED' as const },
      { itemId: itemIds[1], qty: 100, totalPrice: 100 * 2500, status: 'PENDING' as const },
      { itemId: itemIds[2], qty: 400, totalPrice: 400 * 1750, status: 'SHIPPED' as const },
    ];
    for (const tx of txData) {
      await prisma.transaction.create({
        data: {
          buyerId: msmeId,
          ...tx,
        },
      });
      // eslint-disable-next-line no-console
      console.log(`+ transaksi: item=${tx.itemId.slice(0, 8)}... qty=${tx.qty} [${tx.status}]`);
    }
  } else {
    // eslint-disable-next-line no-console
    console.log(`✓ transaksi sudah ada (${existingTxCount} baris)`);
  }

  // eslint-disable-next-line no-console
  console.log(`
╔═══════════════════════════════════════════════════╗
║  ✅ Seeding selesai — BinGo siap untuk demo!     ║
║                                                   ║
║  Akun demo (password: ${DEMO_PASSWORD}):         ║
║  • Warga:    08111111111  (Budi Santoso)          ║
║  • Pemulung: 08222222222  (Agus Pramono)          ║
║  • UMKM:     08333333333  (Siti Rahayu)           ║
╚═══════════════════════════════════════════════════╝
`);
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
