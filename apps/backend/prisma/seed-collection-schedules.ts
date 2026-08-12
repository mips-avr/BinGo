import type { PrismaClient } from '@prisma/client';

import { normalizeRegionKey } from '@bingo/shared-types';

const VERIFIED_AT = new Date('2026-08-12T00:00:00.000Z');

const SCHEDULES = [
  {
    title: 'Pengangkutan sampah organik RW 01',
    publisherName: 'Bank Sampah Berkah Srikandi RW 01',
    publisherType: 'BANK_SAMPAH' as const,
    serviceMode: 'DOOR_TO_DOOR' as const,
    area: 'RW 01 Pondok Bambu, Duren Sawit, Jakarta Timur',
    materials: ['ORGANIC'] as const,
    days: ['TUESDAY', 'THURSDAY', 'SATURDAY'] as const,
    startTime: null,
    endTime: null,
    scheduleNote: 'Diambil dari wadah organik yang tersedia di setiap rumah.',
    preparationNote: 'Pisahkan sisa makanan dan sisa memasak dari sampah anorganik.',
    sourceUrl:
      'https://timur.jakarta.go.id/berita/18044/kurangi-volume-sampah-jejak-inovasi-warga-rw-01-pondok-bambu-kelola-sampah',
  },
  {
    title: 'Pengangkutan malam TPS Jalan Bugis',
    publisherName: 'Kelurahan Kebon Bawang dan Satpel LH Tanjung Priok',
    publisherType: 'SUDIN_LH' as const,
    serviceMode: 'COLLECTION_POINT' as const,
    area: 'TPS Jalan Bugis, Kebon Bawang, Tanjung Priok, Jakarta Utara',
    materials: ['MIXED'] as const,
    // Sumber menyebut satu kali pengangkutan, tetapi tidak menyebut hari.
    // Array dibiarkan kosong agar aplikasi tidak mengarang pola harian.
    days: [] as const,
    startTime: '20:00',
    endTime: '00:00',
    scheduleNote: 'Satu kali pengangkutan pada malam hari.',
    preparationNote: 'Ikuti pengaturan pembuangan wilayah dan pilah sampah dari rumah.',
    sourceUrl:
      'https://utara.jakarta.go.id/kelurahan/kebon-bawang/berita/1537-penataan-tps-jalan-bugis-diperkuat',
  },
];

/** Seed jadwal rutin dari sumber pemerintah yang dapat ditelusuri. */
export async function seedCollectionSchedules(prisma: PrismaClient, log: (msg: string) => void) {
  for (const schedule of SCHEDULES) {
    const data = {
      ...schedule,
      materials: [...schedule.materials],
      days: [...schedule.days],
      regionKey: normalizeRegionKey(schedule.area),
      verifiedAt: VERIFIED_AT,
      active: true,
    };

    await prisma.collectionSchedule.upsert({
      where: { sourceUrl: schedule.sourceUrl },
      create: data,
      update: data,
    });
  }

  log(`✓ Jadwal pengangkutan rutin: ${SCHEDULES.length} sumber resmi`);
}
