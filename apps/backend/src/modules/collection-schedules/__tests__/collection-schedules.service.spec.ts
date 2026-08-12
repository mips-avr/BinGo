import { CollectionSchedulesService } from '../collection-schedules.service';

describe('CollectionSchedulesService', () => {
  const findMany = jest.fn();
  const service = new CollectionSchedulesService({ collectionSchedule: { findMany } } as never);

  beforeEach(() => {
    findMany.mockReset();
    findMany.mockResolvedValue([]);
  });

  it('menampilkan semua jadwal aktif tanpa mencampurnya dengan pickup request', async () => {
    await service.list({});

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { active: true },
        orderBy: [{ area: 'asc' }, { title: 'asc' }],
      }),
    );
  });

  it('menormalisasi wilayah dan menerapkan filter material serta hari', async () => {
    await service.list({
      region: '  Duren Sawit, Jakarta Timur ',
      material: 'ORGANIC',
      day: 'TUESDAY',
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          active: true,
          regionKey: { contains: 'duren sawit jakarta timur' },
          materials: { has: 'ORGANIC' },
          days: { has: 'TUESDAY' },
        },
      }),
    );
  });

  it('mengubah tanggal pemeriksaan menjadi ISO pada respons', async () => {
    findMany.mockResolvedValue([
      {
        id: 'schedule-1',
        title: 'Pengangkutan organik',
        publisherName: 'Bank Sampah',
        publisherType: 'BANK_SAMPAH',
        serviceMode: 'DOOR_TO_DOOR',
        area: 'RW 01 Pondok Bambu',
        regionKey: 'rw 01 pondok bambu',
        materials: ['ORGANIC'],
        days: ['TUESDAY'],
        startTime: null,
        endTime: null,
        scheduleNote: null,
        preparationNote: null,
        sourceUrl: 'https://example.test/source',
        verifiedAt: new Date('2026-08-12T00:00:00.000Z'),
      },
    ]);

    const result = await service.list({});

    expect(result[0]?.verifiedAt).toBe('2026-08-12T00:00:00.000Z');
  });
});
