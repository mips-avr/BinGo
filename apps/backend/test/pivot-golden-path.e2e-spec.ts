import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { bootstrapTestApp } from './helpers/bootstrap-app';

const PASSWORD = 'demo12345678';

describe('Pivot five-role golden path (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const tokens: Record<string, string> = {};
  const stamp = Date.now().toString().slice(-8);
  const applicantPhone = `+62813${stamp}`;
  let applicantUserId = '';
  let applicantOrgId = '';
  let createdRouteId = '';
  let createdRunId = '';
  let createdCollectorUserId = '';
  let createdFacilityId = '';
  let createdAreaId = '';

  async function login(name: string, phone: string) {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ phone, password: PASSWORD })
      .expect(200);
    tokens[name] = response.body.token.accessToken;
  }

  const auth = (name: string) => `Bearer ${tokens[name]}`;

  beforeAll(async () => {
    app = await bootstrapTestApp();
    prisma = app.get(PrismaService);
    await Promise.all([
      login('admin', '+6281100000001'),
      login('manager', '+6281100000002'),
      login('operator', '+6281100000003'),
      login('collector', '+6281100000004'),
      login('household', '+6281100000006'),
      login('business', '+6281100000007'),
      login('businessTwo', '+6281100000008'),
    ]);
  });

  afterAll(async () => {
    const managerOrg = await prisma.organization.findUnique({
      where: { slug: 'pengelola-sirkular-rw-08-demo' },
    });
    if (managerOrg?.status === 'SUSPENDED') {
      await prisma.organization.update({
        where: { id: managerOrg.id },
        data: { status: 'ACTIVE', suspensionReason: null, suspendedAt: null },
      });
    }
    if (applicantOrgId) await prisma.organization.deleteMany({ where: { id: applicantOrgId } });
    if (applicantUserId) await prisma.user.deleteMany({ where: { id: applicantUserId } });
    if (createdRunId) await prisma.collectionRun.deleteMany({ where: { id: createdRunId } });
    if (createdRouteId) await prisma.collectionRoute.deleteMany({ where: { id: createdRouteId } });
    if (createdCollectorUserId)
      await prisma.user.deleteMany({ where: { id: createdCollectorUserId } });
    if (createdFacilityId) await prisma.facility.deleteMany({ where: { id: createdFacilityId } });
    if (createdAreaId) await prisma.serviceArea.deleteMany({ where: { id: createdAreaId } });
    await app.close();
  });

  it('self-registration, dokumen privat, submit, dan approval berjalan tanpa manipulasi database', async () => {
    const registration = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Pemohon E2E',
        phone: applicantPhone,
        password: PASSWORD,
        role: 'MANAGER_ADMIN',
        organizationName: `Pengelola E2E ${stamp}`,
      })
      .expect(201);
    applicantUserId = registration.body.user.id;
    tokens.applicant = registration.body.token.accessToken;

    const updated = await request(app.getHttpServer())
      .patch('/api/v1/organization-applications/mine')
      .set('Authorization', auth('applicant'))
      .send({
        organizationName: `Pengelola E2E ${stamp}`,
        organizationType: 'MANAGER',
        responsibleName: 'Penanggung Jawab E2E',
        contactPhone: applicantPhone,
        address: 'Alamat Organisasi E2E, Jakarta',
        serviceRegions: ['Jakarta Timur'],
        authorityBasis: 'Surat tugas demo E2E',
        managedFacilities: ['TPS3R E2E'],
        acceptedMaterials: ['ORGANIC'],
        declarationAccepted: true,
      })
      .expect(200);
    applicantOrgId = updated.body.organizationId;

    const uploaded = await request(app.getHttpServer())
      .post('/api/v1/organization-applications/mine/documents')
      .set('Authorization', auth('applicant'))
      .field('label', 'Surat tugas E2E')
      .attach('file', Buffer.from('%PDF-1.4 demo evidence'), {
        filename: 'evidence.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/v1/organization-applications/documents/${uploaded.body.id}`)
      .set('Authorization', auth('applicant'))
      .expect(200)
      .expect('Content-Type', /application\/pdf/);

    await request(app.getHttpServer())
      .get(`/api/v1/organization-applications/documents/${uploaded.body.id}`)
      .set('Authorization', auth('household'))
      .expect(403);

    const submitted = await request(app.getHttpServer())
      .post('/api/v1/organization-applications/mine/submit')
      .set('Authorization', auth('applicant'))
      .expect(201);
    expect(submitted.body.status).toBe('PENDING_REVIEW');

    await request(app.getHttpServer())
      .get('/api/v1/pivot/manager/operations')
      .set('Authorization', auth('applicant'))
      .expect(403);

    await request(app.getHttpServer())
      .post(`/api/v1/platform/applications/${submitted.body.id}/approve`)
      .set('Authorization', auth('admin'))
      .send({ reason: 'Identitas, kewenangan, dan dokumen pengajuan telah diperiksa' })
      .expect(201);

    const dashboard = await request(app.getHttpServer())
      .get('/api/v1/pivot/dashboard')
      .set('Authorization', auth('applicant'))
      .expect(200);
    expect(dashboard.body.title).toContain('Pengelola E2E');
  });

  it('RBAC memisahkan platform admin dari endpoint transaksi tenant', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/platform/dashboard')
      .set('Authorization', auth('admin'))
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/v1/platform/dashboard')
      .set('Authorization', auth('manager'))
      .expect(403);
    await request(app.getHttpServer())
      .get('/api/v1/pivot/manager/operations')
      .set('Authorization', auth('admin'))
      .expect(403);
  });

  it('CRUD list-first membatasi tenant, mengarsipkan data, dan mencatat audit', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/manager/resources/service-areas')
      .set('Authorization', auth('manager'))
      .send({
        data: { name: `Wilayah CRUD E2E ${stamp}`, region: 'Jakarta Timur', status: 'ACTIVE' },
      })
      .expect(201);
    createdAreaId = created.body.id;

    await request(app.getHttpServer())
      .patch(`/api/v1/manager/resources/service-areas/${createdAreaId}`)
      .set('Authorization', auth('manager'))
      .send({
        data: { name: `Wilayah CRUD Diperbarui ${stamp}`, organizationId: 'tidak-boleh-berubah' },
      })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/manager/resources/service-areas/${createdAreaId}/archive`)
      .set('Authorization', auth('manager'))
      .send({ reason: 'Uji arsip resource pada E2E' })
      .expect(201);

    const archived = await request(app.getHttpServer())
      .get('/api/v1/manager/resources/service-areas?archived=true&search=CRUD&page=1&pageSize=20')
      .set('Authorization', auth('manager'))
      .expect(200);
    expect(archived.body.items.some((item: { id: string }) => item.id === createdAreaId)).toBe(
      true,
    );

    await request(app.getHttpServer())
      .get('/api/v1/manager/resources/service-areas')
      .set('Authorization', auth('business'))
      .expect(403);

    const audit = await prisma.auditEvent.findFirst({
      where: {
        resourceId: createdAreaId,
        action: 'RESOURCE_ARCHIVED',
        resourceType: 'service-areas',
      },
    });
    expect(audit).not.toBeNull();
  });

  it('MANAGER_OPERATOR tidak dapat membuat akun Petugas', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/manager/resources/collectors')
      .set('Authorization', auth('operator'))
      .send({
        data: {
          name: 'Petugas Tidak Sah',
          phone: `+62815${stamp}`,
          employeeNo: `DENY-${stamp}`,
          initialPassword: PASSWORD,
        },
      })
      .expect(403);
  });

  it('Admin mengelola fasilitas dengan sumber dan verifikasi yang dapat diaudit', async () => {
    const facility = await request(app.getHttpServer())
      .post('/api/v1/platform/facilities')
      .set('Authorization', auth('admin'))
      .send({
        name: `Fasilitas E2E ${stamp}`,
        operatorName: 'Operator E2E Demo',
        address: 'Alamat Fasilitas E2E, Jakarta',
        lat: -6.225,
        lng: 106.9,
        sourceUrl: 'https://lingkunganhidup.jakarta.go.id/',
        openingNote: '08.00 sampai 16.00',
        materials: ['ORGANIC', 'PAPER'],
      })
      .expect(201);
    createdFacilityId = facility.body.id;
    expect(facility.body.materialRules).toHaveLength(2);

    await request(app.getHttpServer())
      .post(`/api/v1/platform/facilities/${facility.body.id}/verify`)
      .set('Authorization', auth('admin'))
      .send({
        sourceUrl: 'https://lingkunganhidup.jakarta.go.id/',
        note: 'Sumber dan jadwal telah diperiksa untuk E2E',
      })
      .expect(201);

    const audits = await request(app.getHttpServer())
      .get('/api/v1/platform/audit-events')
      .set('Authorization', auth('admin'))
      .expect(200);
    expect(
      audits.body.some(
        (event: { action: string; resourceId: string }) =>
          event.action === 'FACILITY_VERIFIED' && event.resourceId === facility.body.id,
      ),
    ).toBe(true);
  });

  it('Pengelola dapat membuat Petugas, kartu, rute, dan tugas tanpa manipulasi database', async () => {
    const operations = await request(app.getHttpServer())
      .get('/api/v1/pivot/manager/operations')
      .set('Authorization', auth('manager'))
      .expect(200);
    expect(operations.body.areas.length).toBeGreaterThan(0);
    expect(operations.body.routes.length).toBeGreaterThan(0);
    expect(operations.body.vehicles.length).toBeGreaterThan(0);
    expect(operations.body.invoices.length).toBeGreaterThan(0);

    const collector = await request(app.getHttpServer())
      .post('/api/v1/pivot/manager/collectors')
      .set('Authorization', auth('manager'))
      .send({
        name: `Petugas E2E ${stamp}`,
        phone: `+62814${stamp}`,
        employeeNo: `E2E-${stamp}`,
        initialPassword: PASSWORD,
      })
      .expect(201);
    createdCollectorUserId = collector.body.userId;

    const card = await request(app.getHttpServer())
      .post(`/api/v1/pivot/manager/collectors/${collector.body.id}/cards`)
      .set('Authorization', auth('manager'))
      .send({ cardNumber: `BG-E2E-${stamp}` })
      .expect(201);
    expect(card.body.collectorId).toBe(collector.body.id);

    const route = await request(app.getHttpServer())
      .post('/api/v1/pivot/manager/routes')
      .set('Authorization', auth('manager'))
      .send({
        serviceAreaId: operations.body.areas[0].id,
        name: `Rute E2E ${stamp}`,
        stops: ['Alamat E2E Nomor 1', 'Alamat E2E Nomor 2'],
      })
      .expect(201);
    createdRouteId = route.body.id;
    expect(route.body.stops).toHaveLength(2);

    const run = await request(app.getHttpServer())
      .post('/api/v1/pivot/manager/runs')
      .set('Authorization', auth('manager'))
      .send({
        routeId: route.body.id,
        collectorId: collector.body.id,
        vehicleId: operations.body.vehicles[0].id,
        scheduledFor: new Date(Date.now() + 86_400_000).toISOString(),
      })
      .expect(201);
    createdRunId = run.body.id;
    expect(run.body.assignments).toHaveLength(1);
  });

  it('pembayaran mock dan card tap bersifat idempoten', async () => {
    const seededInvoice = await prisma.invoice.findUniqueOrThrow({
      where: {
        subscriptionId_period: {
          subscriptionId: (
            await prisma.subscription.findFirstOrThrow({
              where: { household: { user: { phone: '+6281100000006' } } },
            })
          ).id,
          period: '2026-08',
        },
      },
    });
    await prisma.paymentEvent.deleteMany({ where: { invoiceId: seededInvoice.id } });
    await prisma.invoice.update({
      where: { id: seededInvoice.id },
      data: { status: 'UNPAID', paidAt: null },
    });
    const service = await request(app.getHttpServer())
      .get('/api/v1/pivot/household/service')
      .set('Authorization', auth('household'))
      .expect(200);
    expect(service.body.invoice.amount).toBe(30000);
    const key = `e2e-payment-${stamp}`;
    const accepted = await request(app.getHttpServer())
      .post(`/api/v1/pivot/invoices/${service.body.invoice.id}/pay`)
      .set('Authorization', auth('household'))
      .send({ idempotencyKey: key, method: 'QRIS Demo' })
      .expect(201);
    expect(accepted.body.result).toBe('accepted');
    const duplicate = await request(app.getHttpServer())
      .post(`/api/v1/pivot/invoices/${service.body.invoice.id}/pay`)
      .set('Authorization', auth('household'))
      .send({ idempotencyKey: key, method: 'QRIS Demo' })
      .expect(201);
    expect(duplicate.body.result).toBe('duplicate');

    const deviceEventId = `e2e-card-${stamp}`;
    const firstTap = await request(app.getHttpServer())
      .post('/api/v1/pivot/cards/tap')
      .set('Authorization', auth('manager'))
      .send({ credential: 'BG-DEMO-0001', deviceEventId, source: 'SIMULATOR' })
      .expect(201);
    expect(firstTap.body.result).toBe('accepted');
    const secondTap = await request(app.getHttpServer())
      .post('/api/v1/pivot/cards/tap')
      .set('Authorization', auth('manager'))
      .send({ credential: 'BG-DEMO-0001', deviceEventId, source: 'SIMULATOR' })
      .expect(201);
    expect(secondTap.body.result).toBe('duplicate');
  });

  it('weight event idempoten, neraca massa wajib seimbang, dan batch approved append-only', async () => {
    const batchResponse = await request(app.getHttpServer())
      .post('/api/v1/pivot/manager/intake-batches')
      .set('Authorization', auth('manager'))
      .send({ batchNo: `E2E-BATCH-${stamp}` })
      .expect(201);
    const batch = batchResponse.body;
    const postWeight = (
      deviceEventId: string,
      direction: string,
      material: string,
      weightKg: number,
    ) =>
      request(app.getHttpServer())
        .post('/api/v1/pivot/weight-events')
        .set('Authorization', auth('manager'))
        .send({
          intakeBatchId: batch.id,
          deviceEventId,
          direction,
          source: 'SIMULATOR',
          material,
          weightKg,
        });
    const first = await postWeight(`e2e-in-${stamp}`, 'IN', 'MIXED', 10).expect(201);
    expect(first.body.result).toBe('accepted');
    const duplicate = await postWeight(`e2e-in-${stamp}`, 'IN', 'MIXED', 10).expect(201);
    expect(duplicate.body.result).toBe('duplicate');
    await postWeight(`e2e-out-${stamp}`, 'SORTED_OUTPUT', 'ORGANIC', 7).expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/pivot/intake-batches/${batch.id}/approve`)
      .set('Authorization', auth('manager'))
      .expect(409);
    await postWeight(`e2e-residue-${stamp}`, 'RESIDUE', 'MIXED', 3).expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/pivot/intake-batches/${batch.id}/approve`)
      .set('Authorization', auth('manager'))
      .expect(201);
    await postWeight(`e2e-after-approval-${stamp}`, 'RESIDUE', 'MIXED', 1).expect(409);
  });

  it('lot tidak dapat dijual ganda, penerimaan menambah diversion, dan suspensi memblokir transaksi baru', async () => {
    const batch = await request(app.getHttpServer())
      .post('/api/v1/pivot/manager/intake-batches')
      .set('Authorization', auth('manager'))
      .send({ batchNo: `E2E-SALE-${stamp}` })
      .expect(201);
    for (const event of [
      { direction: 'IN', material: 'MIXED', weightKg: 20, suffix: 'in' },
      { direction: 'SORTED_OUTPUT', material: 'GLASS', weightKg: 20, suffix: 'out' },
    ]) {
      const { suffix, ...weight } = event;
      await request(app.getHttpServer())
        .post('/api/v1/pivot/weight-events')
        .set('Authorization', auth('manager'))
        .send({
          intakeBatchId: batch.body.id,
          deviceEventId: `e2e-sale-${suffix}-${stamp}`,
          source: 'SIMULATOR',
          ...weight,
        })
        .expect(201);
    }
    await request(app.getHttpServer())
      .post(`/api/v1/pivot/intake-batches/${batch.body.id}/approve`)
      .set('Authorization', auth('manager'))
      .expect(201);
    const lot = await request(app.getHttpServer())
      .post('/api/v1/pivot/manager/lots')
      .set('Authorization', auth('manager'))
      .send({ material: 'GLASS', quantityKg: 20, pricePerKg: 1200 })
      .expect(201);
    const order = await request(app.getHttpServer())
      .post('/api/v1/pivot/business/orders')
      .set('Authorization', auth('business'))
      .send({ lotId: lot.body.id, quantityKg: 15 })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/pivot/business/orders')
      .set('Authorization', auth('businessTwo'))
      .send({ lotId: lot.body.id, quantityKg: 10 })
      .expect(409);
    await request(app.getHttpServer())
      .post(`/api/v1/pivot/manager/orders/${order.body.id}/confirm`)
      .set('Authorization', auth('manager'))
      .send({ reason: 'Stok E2E telah diverifikasi Pengelola' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/pivot/business/orders/${order.body.id}/receive`)
      .set('Authorization', auth('business'))
      .send({ receivedKg: 15, residueKg: 1, note: 'Diterima E2E' })
      .expect(201);

    const organization = await prisma.organization.findUniqueOrThrow({
      where: { slug: 'pengelola-sirkular-rw-08-demo' },
    });
    await request(app.getHttpServer())
      .post(`/api/v1/platform/organizations/${organization.id}/suspend`)
      .set('Authorization', auth('admin'))
      .send({ reason: 'Uji suspensi golden path' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/pivot/manager/lots')
      .set('Authorization', auth('manager'))
      .send({ material: 'PAPER', quantityKg: 1, pricePerKg: 500 })
      .expect(403);
    expect(await prisma.purchaseOrder.count({ where: { id: order.body.id } })).toBe(1);
    await request(app.getHttpServer())
      .post(`/api/v1/platform/organizations/${organization.id}/reactivate`)
      .set('Authorization', auth('admin'))
      .send({ reason: 'Uji suspensi selesai dan organisasi memenuhi pemeriksaan' })
      .expect(201);
  });
});
