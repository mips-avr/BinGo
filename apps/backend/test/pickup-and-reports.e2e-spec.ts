import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { bootstrapTestApp } from './helpers/bootstrap-app';

interface AuthResp {
  user: { id: string; pointsBalance: number };
  token: { accessToken: string };
}

async function register(
  app: INestApplication,
  payload: { name: string; phone: string; role: 'CITIZEN' | 'WASTE_AGENT' | 'MSME'; nik?: string },
): Promise<AuthResp> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/register')
    .send({ ...payload, password: 'rahasiaSekali123' })
    .expect(201);
  return res.body as AuthResp;
}

/**
 * Tujuan: membuktikan alur Phase 3 ujung-ke-ujung dengan PostGIS asli.
 * - Warga membuat pickup di Bundaran HI
 * - Pemulung melihatnya via /nearby (ST_DWithin 5 km dari Monas)
 * - Pemulung accept → complete → warga mendapat poin PICKUP_COMPLETED (25)
 * - Warga lain memverifikasi laporan 3x → status DIVERIFIKASI + 50 poin
 * - Pemulung menutup laporan → SELESAI
 * - MSME daftar item dan checkout (mock payment); stok berkurang.
 */
describe('Phase 3 e2e — pickup geospatial + reports + marketplace', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const stamp = Date.now().toString().slice(-7);
  const citizenPhone = `+62812${stamp}11`;
  const verifier1Phone = `+62812${stamp}21`;
  const verifier2Phone = `+62812${stamp}22`;
  const verifier3Phone = `+62812${stamp}23`;
  const agentPhone = `+62812${stamp}31`;
  const msmePhone = `+62812${stamp}41`;

  let citizen: AuthResp;
  let v1: AuthResp;
  let v2: AuthResp;
  let v3: AuthResp;
  let agent: AuthResp;
  let msme: AuthResp;

  beforeAll(async () => {
    app = await bootstrapTestApp();
    prisma = app.get(PrismaService);
    [citizen, v1, v2, v3, agent, msme] = await Promise.all([
      register(app, { name: 'Warga A', phone: citizenPhone, role: 'CITIZEN' }),
      register(app, { name: 'Verifier 1', phone: verifier1Phone, role: 'CITIZEN' }),
      register(app, { name: 'Verifier 2', phone: verifier2Phone, role: 'CITIZEN' }),
      register(app, { name: 'Verifier 3', phone: verifier3Phone, role: 'CITIZEN' }),
      register(app, { name: 'Pak Pemulung', phone: agentPhone, role: 'WASTE_AGENT' }),
      register(app, { name: 'Toko Hijau', phone: msmePhone, role: 'MSME' }),
    ]);
  });

  afterAll(async () => {
    await prisma.transaction.deleteMany({ where: { buyer: { phone: msmePhone } } });
    await prisma.marketplaceItem.deleteMany({ where: { supplierName: 'CV Hijau Lestari (Test)' } });
    await prisma.pickupRequest.deleteMany({ where: { citizen: { phone: citizenPhone } } });
    await prisma.report.deleteMany({ where: { citizen: { phone: citizenPhone } } });
    await prisma.user.deleteMany({
      where: {
        phone: { in: [citizenPhone, verifier1Phone, verifier2Phone, verifier3Phone, agentPhone, msmePhone] },
      },
    });
    await app.close();
  });

  // --------------------------- Pickup geospatial ---------------------------

  let pickupId = '';

  it('warga membuat permintaan penjemputan di Bundaran HI', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/pickup-requests')
      .set('Authorization', `Bearer ${citizen.token.accessToken}`)
      .send({
        location: { lat: -6.1944, lng: 106.8229 },
        address: 'Bundaran HI, Jakarta Pusat',
        materialType: 'PET',
        estimatedWeightKg: 2.5,
      })
      .expect(201);
    expect(res.body.status).toBe('PENDING');
    expect(res.body.location).toEqual({ lat: -6.1944, lng: 106.8229 });
    pickupId = res.body.id;
  });

  it('pemulung melihatnya via /nearby dari Monas dengan jarak ~2 km', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/pickup-requests/nearby?lat=-6.1754&lng=106.8272&radiusKm=5')
      .set('Authorization', `Bearer ${agent.token.accessToken}`)
      .expect(200);

    const ours = res.body.find((p: { id: string }) => p.id === pickupId);
    expect(ours).toBeDefined();
    expect(ours.distanceMeters).toBeGreaterThan(1500);
    expect(ours.distanceMeters).toBeLessThan(3000);
  });

  it('warga TIDAK bisa mengakses /nearby (RBAC)', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/pickup-requests/nearby?lat=-6.1754&lng=106.8272')
      .set('Authorization', `Bearer ${citizen.token.accessToken}`)
      .expect(403);
  });

  it('pemulung accept → complete; warga mendapat 25 poin', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/pickup-requests/${pickupId}/accept`)
      .set('Authorization', `Bearer ${agent.token.accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/pickup-requests/${pickupId}/complete`)
      .set('Authorization', `Bearer ${agent.token.accessToken}`)
      .expect(200);

    const meRes = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${citizen.token.accessToken}`)
      .expect(200);
    expect(meRes.body.pointsBalance).toBe(25);
  });

  it('agen kedua tidak bisa menerima request yang sudah selesai', async () => {
    const agent2 = await register(app, {
      name: 'Pemulung 2',
      phone: `+62812${stamp}32`,
      role: 'WASTE_AGENT',
    });
    await request(app.getHttpServer())
      .patch(`/api/v1/pickup-requests/${pickupId}/accept`)
      .set('Authorization', `Bearer ${agent2.token.accessToken}`)
      .expect(404);
    await prisma.user.delete({ where: { phone: `+62812${stamp}32` } });
  });

  // ------------------------------ Reports ----------------------------------

  let reportId = '';

  it('warga membuat laporan dengan foto + GPS', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${citizen.token.accessToken}`)
      .send({
        location: { lat: -6.2, lng: 106.81 },
        imageUrl: 'https://cdn.bingo.id/test-illegal-dump.jpg',
        description: 'Tumpukan sampah di pinggir kali',
      })
      .expect(201);
    expect(res.body.status).toBe('DILAPORKAN');
    expect(res.body.verificationCount).toBe(0);
    reportId = res.body.id;
  });

  it('pembuat laporan tidak bisa memverifikasi laporannya sendiri', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/reports/${reportId}/verify`)
      .set('Authorization', `Bearer ${citizen.token.accessToken}`)
      .expect(400);
  });

  it('3 verifikasi berbeda → status DIVERIFIKASI + 50 poin ke pelapor', async () => {
    for (const verifier of [v1, v2, v3]) {
      await request(app.getHttpServer())
        .patch(`/api/v1/reports/${reportId}/verify`)
        .set('Authorization', `Bearer ${verifier.token.accessToken}`)
        .expect(200);
    }
    const final = await request(app.getHttpServer())
      .get(`/api/v1/reports/${reportId}`)
      .set('Authorization', `Bearer ${citizen.token.accessToken}`)
      .expect(200);
    expect(final.body.status).toBe('DIVERIFIKASI');
    expect(final.body.verificationCount).toBe(3);

    const meRes = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${citizen.token.accessToken}`)
      .expect(200);
    // 25 (pickup) + 50 (report verified)
    expect(meRes.body.pointsBalance).toBe(75);
  });

  it('pemulung menutup laporan → status SELESAI', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/reports/${reportId}/resolve`)
      .set('Authorization', `Bearer ${agent.token.accessToken}`)
      .expect(200);
    const final = await request(app.getHttpServer())
      .get(`/api/v1/reports/${reportId}`)
      .set('Authorization', `Bearer ${citizen.token.accessToken}`)
      .expect(200);
    expect(final.body.status).toBe('SELESAI');
  });

  // ---------------------------- Marketplace --------------------------------

  let itemId = '';

  it('MSME bisa membuat item baru di marketplace', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/marketplace/items')
      .set('Authorization', `Bearer ${msme.token.accessToken}`)
      .send({
        supplierName: 'CV Hijau Lestari (Test)',
        itemName: 'Kantong kraft 30x40 (Test)',
        description: 'Kantong kertas kraft food-grade',
        price: 1500,
        minOrderQty: 100,
        stock: 1000,
      })
      .expect(201);
    expect(res.body.price).toBe(1500);
    expect(res.body.stock).toBe(1000);
    itemId = res.body.id;
  });

  it('Warga TIDAK bisa membuat item (RBAC, MSME-only)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/marketplace/items')
      .set('Authorization', `Bearer ${citizen.token.accessToken}`)
      .send({
        supplierName: 'X',
        itemName: 'Y',
        description: 'Z',
        price: 100,
        minOrderQty: 1,
      })
      .expect(403);
  });

  it('Daftar item terbuka untuk semua peran (warga juga bisa lihat)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/marketplace/items?search=test')
      .set('Authorization', `Bearer ${citizen.token.accessToken}`)
      .expect(200);
    expect(res.body.find((i: { id: string }) => i.id === itemId)).toBeDefined();
  });

  it('MSME checkout 200 unit → 2 transaksi konsolidasi → stok berkurang', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/marketplace/checkout')
      .set('Authorization', `Bearer ${msme.token.accessToken}`)
      .send({
        items: [
          { itemId, qty: 150 },
          { itemId, qty: 50 }, // duplikat — harus digabung menjadi 1 transaksi 200 unit
        ],
      })
      .expect(201);
    expect(res.body.transactions).toHaveLength(1);
    expect(res.body.transactions[0].qty).toBe(200);
    expect(res.body.totalAmount).toBe(200 * 1500);

    const itemRes = await request(app.getHttpServer())
      .get(`/api/v1/marketplace/items/${itemId}`)
      .set('Authorization', `Bearer ${msme.token.accessToken}`)
      .expect(200);
    expect(itemRes.body.stock).toBe(800);
  });

  it('Checkout menolak jika qty < minOrderQty', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/marketplace/checkout')
      .set('Authorization', `Bearer ${msme.token.accessToken}`)
      .send({ items: [{ itemId, qty: 10 }] })
      .expect(400);
  });

  it('Checkout menolak jika stok tidak cukup (Conflict)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/marketplace/checkout')
      .set('Authorization', `Bearer ${msme.token.accessToken}`)
      .send({ items: [{ itemId, qty: 100000 }] })
      .expect(409);
  });

  it('Warga TIDAK bisa checkout (RBAC, MSME-only)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/marketplace/checkout')
      .set('Authorization', `Bearer ${citizen.token.accessToken}`)
      .send({ items: [{ itemId, qty: 100 }] })
      .expect(403);
  });
});
