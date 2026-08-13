import { config as loadDotEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

for (const path of [resolve(__dirname, '../.env'), resolve(__dirname, '../../../.env')]) {
  if (existsSync(path)) {
    loadDotEnv({ path });
    break;
  }
}

const prisma = new PrismaClient();
const PASSWORD = 'demo12345678';

async function user(
  phone: string,
  name: string,
  role:
    | 'PLATFORM_ADMIN'
    | 'MANAGER_ADMIN'
    | 'MANAGER_OPERATOR'
    | 'COLLECTOR'
    | 'HOUSEHOLD'
    | 'BUSINESS_BUYER',
  passwordHash: string,
) {
  return prisma.user.upsert({
    where: { phone },
    update: { name, role, passwordHash, active: true },
    create: { phone, name, role, passwordHash },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const admin = await user('+6281100000001', 'Admin BinGo Demo', 'PLATFORM_ADMIN', passwordHash);
  const manager = await user(
    '+6281100000002',
    'Rina Pengelola Demo',
    'MANAGER_ADMIN',
    passwordHash,
  );
  const operator = await user(
    '+6281100000003',
    'Dimas Operator Demo',
    'MANAGER_OPERATOR',
    passwordHash,
  );
  const collectorA = await user('+6281100000004', 'Agus Petugas Demo', 'COLLECTOR', passwordHash);
  const collectorB = await user('+6281100000005', 'Sari Petugas Demo', 'COLLECTOR', passwordHash);
  const householdUser = await user('+6281100000006', 'Budi Warga Demo', 'HOUSEHOLD', passwordHash);
  const businessUser = await user(
    '+6281100000007',
    'Maya Business Demo',
    'BUSINESS_BUYER',
    passwordHash,
  );
  const businessTwoUser = await user(
    '+6281100000008',
    'Tono Pengolah Demo',
    'BUSINESS_BUYER',
    passwordHash,
  );
  const pendingManager = await user(
    '+6281100000009',
    'Pemohon Pengelola Demo',
    'MANAGER_ADMIN',
    passwordHash,
  );
  const pendingBusiness = await user(
    '+6281100000010',
    'Pemohon Business Demo',
    'BUSINESS_BUYER',
    passwordHash,
  );

  await prisma.platformRole.upsert({
    where: { userId_role: { userId: admin.id, role: 'PLATFORM_ADMIN' } },
    update: {},
    create: { userId: admin.id, role: 'PLATFORM_ADMIN' },
  });

  const managerOrg = await prisma.organization.upsert({
    where: { slug: 'pengelola-sirkular-rw-08-demo' },
    update: { status: 'ACTIVE' },
    create: {
      name: 'Pengelola Sirkular RW 08 (Demo)',
      slug: 'pengelola-sirkular-rw-08-demo',
      type: 'MANAGER',
      status: 'ACTIVE',
      contactName: manager.name,
      contactPhone: manager.phone,
      address: 'Jl. Sirkular Demo No. 8, Jakarta Timur',
    },
  });
  const businessOrg = await prisma.organization.upsert({
    where: { slug: 'kompos-nusantara-demo' },
    update: { status: 'ACTIVE' },
    create: {
      name: 'Kompos Nusantara (Demo)',
      slug: 'kompos-nusantara-demo',
      type: 'BUSINESS',
      status: 'ACTIVE',
      contactName: businessUser.name,
      contactPhone: businessUser.phone,
      address: 'Kawasan Industri Demo, Bekasi',
    },
  });
  const businessTwoOrg = await prisma.organization.upsert({
    where: { slug: 'kemasan-kembali-demo' },
    update: { status: 'ACTIVE' },
    create: {
      name: 'Kemasan Kembali (Demo)',
      slug: 'kemasan-kembali-demo',
      type: 'BUSINESS',
      status: 'ACTIVE',
      contactName: businessTwoUser.name,
      contactPhone: businessTwoUser.phone,
      address: 'Kawasan Daur Ulang Demo, Tangerang',
    },
  });

  const memberships = [
    [managerOrg.id, manager.id, 'MANAGER_ADMIN'],
    [managerOrg.id, operator.id, 'MANAGER_OPERATOR'],
    [managerOrg.id, collectorA.id, 'COLLECTOR'],
    [managerOrg.id, collectorB.id, 'COLLECTOR'],
    [managerOrg.id, householdUser.id, 'HOUSEHOLD'],
    [businessOrg.id, businessUser.id, 'BUSINESS_BUYER'],
    [businessTwoOrg.id, businessTwoUser.id, 'BUSINESS_BUYER'],
  ] as const;
  for (const [organizationId, userId, role] of memberships) {
    await prisma.organizationMember.upsert({
      where: { organizationId_userId_role: { organizationId, userId, role } },
      update: { active: true },
      create: { organizationId, userId, role },
    });
  }

  const pendingManagerOrg = await prisma.organization.upsert({
    where: { slug: 'pengelola-hijau-rw-12-demo' },
    update: { status: 'PENDING_REVIEW' },
    create: {
      name: 'Pengelola Hijau RW 12 (Demo)',
      slug: 'pengelola-hijau-rw-12-demo',
      type: 'MANAGER',
      status: 'PENDING_REVIEW',
    },
  });
  const pendingBusinessOrg = await prisma.organization.upsert({
    where: { slug: 'pakan-lestari-demo' },
    update: { status: 'PENDING_REVIEW' },
    create: {
      name: 'Pakan Lestari (Demo)',
      slug: 'pakan-lestari-demo',
      type: 'BUSINESS',
      status: 'PENDING_REVIEW',
    },
  });
  for (const [organizationId, userId, role] of [
    [pendingManagerOrg.id, pendingManager.id, 'MANAGER_ADMIN'],
    [pendingBusinessOrg.id, pendingBusiness.id, 'BUSINESS_BUYER'],
  ] as const) {
    await prisma.organizationMember.upsert({
      where: { organizationId_userId_role: { organizationId, userId, role } },
      update: {},
      create: { organizationId, userId, role },
    });
  }

  async function pendingApplication(
    organizationId: string,
    applicantId: string,
    organizationName: string,
    organizationType: 'MANAGER' | 'BUSINESS',
  ) {
    let application = await prisma.organizationApplication.findFirst({ where: { organizationId } });
    if (!application) {
      application = await prisma.organizationApplication.create({
        data: {
          organizationId,
          applicantId,
          organizationName,
          organizationType,
          responsibleName:
            organizationType === 'MANAGER' ? 'Ketua Pengelola Demo' : 'Direktur Usaha Demo',
          contactPhone: organizationType === 'MANAGER' ? '+6281100000009' : '+6281100000010',
          address: 'Alamat pengajuan fiktif untuk demonstrasi',
          serviceRegions: ['DKI Jakarta (Demo)'],
          authorityBasis:
            organizationType === 'MANAGER' ? 'Surat penugasan fiktif untuk demo' : null,
          managedFacilities: organizationType === 'MANAGER' ? ['TPS3R Demo'] : [],
          acceptedMaterials: organizationType === 'BUSINESS' ? ['ORGANIC', 'PAPER'] : [],
          capacityNote: organizationType === 'BUSINESS' ? '50 ton per bulan (Demo)' : null,
          receivingSchedule: 'Senin sampai Sabtu, 08.00 sampai 16.00 (Demo)',
          qualityNotes: 'Material bersih dari limbah B3 (Demo)',
          declarationAccepted: true,
          status: 'PENDING_REVIEW',
          submittedAt: new Date(),
        },
      });
      await prisma.verificationDocument.create({
        data: {
          applicationId: application.id,
          uploadedById: applicantId,
          label: 'Dokumen pendukung Demo',
          storageKey: `demo/verification/${application.id}.pdf`,
          mimeType: 'application/pdf',
          demo: true,
        },
      });
      await prisma.organizationReviewEvent.create({
        data: { applicationId: application.id, version: 1, decision: 'SUBMITTED' },
      });
    }
    return application;
  }
  await pendingApplication(
    pendingManagerOrg.id,
    pendingManager.id,
    pendingManagerOrg.name,
    'MANAGER',
  );
  await pendingApplication(
    pendingBusinessOrg.id,
    pendingBusiness.id,
    pendingBusinessOrg.name,
    'BUSINESS',
  );

  const dense = await prisma.serviceArea.upsert({
    where: { id: 'demo-area-dense' },
    update: {},
    create: {
      id: 'demo-area-dense',
      organizationId: managerOrg.id,
      name: 'Zona Padat RW 08 (Demo)',
      region: 'Cakung, Jakarta Timur',
      densityLabel: 'Padat',
      status: 'ACTIVE',
    },
  });
  await prisma.serviceArea.upsert({
    where: { id: 'demo-area-sparse' },
    update: {},
    create: {
      id: 'demo-area-sparse',
      organizationId: managerOrg.id,
      name: 'Zona Jarang Penduduk (Demo)',
      region: 'Pinggiran Jakarta Timur',
      densityLabel: 'Jarang',
      status: 'COLLECTING_INTEREST',
    },
  });
  const plan = await prisma.servicePlan.upsert({
    where: { id: 'demo-plan-monthly' },
    update: {},
    create: {
      id: 'demo-plan-monthly',
      organizationId: managerOrg.id,
      serviceAreaId: dense.id,
      name: 'Layanan Kolektif Bulanan (Demo)',
      monthlyFee: 30000,
      collectionDays: ['MONDAY', 'THURSDAY'],
    },
  });

  let firstHouseholdId = '';
  for (let index = 1; index <= 40; index += 1) {
    const household = await prisma.household.upsert({
      where: {
        organizationId_accountNo: {
          organizationId: managerOrg.id,
          accountNo: `RW08-${String(index).padStart(3, '0')}`,
        },
      },
      update: {},
      create: {
        organizationId: managerOrg.id,
        serviceAreaId: dense.id,
        userId: index === 1 ? householdUser.id : undefined,
        accountNo: `RW08-${String(index).padStart(3, '0')}`,
        displayAddress: `Rumah ${index}, RW 08 (Demo)`,
        lat: -6.204 + index * 0.00005,
        lng: 106.94 + index * 0.00004,
      },
    });
    if (index === 1) firstHouseholdId = household.id;
  }
  let subscription = await prisma.subscription.findFirst({
    where: { householdId: firstHouseholdId, servicePlanId: plan.id },
  });
  subscription ??= await prisma.subscription.create({
    data: {
      organizationId: managerOrg.id,
      householdId: firstHouseholdId,
      servicePlanId: plan.id,
      startsAt: new Date('2026-08-01T00:00:00+07:00'),
    },
  });
  await prisma.invoice.upsert({
    where: { subscriptionId_period: { subscriptionId: subscription.id, period: '2026-08' } },
    update: { status: 'UNPAID', paidAt: null },
    create: {
      organizationId: managerOrg.id,
      householdId: firstHouseholdId,
      subscriptionId: subscription.id,
      period: '2026-08',
      amount: 30000,
      dueAt: new Date('2026-08-20T23:59:59+07:00'),
    },
  });

  await prisma.collectionCalendar.upsert({
    where: { id: 'demo-calendar-1' },
    update: {},
    create: {
      id: 'demo-calendar-1',
      organizationId: managerOrg.id,
      serviceAreaId: dense.id,
      title: 'Pengangkutan Senin dan Kamis (Demo)',
      days: ['MONDAY', 'THURSDAY'],
      startTime: '07:00',
      endTime: '11:00',
      materials: ['MIXED'],
    },
  });
  const route = await prisma.collectionRoute.upsert({
    where: { id: 'demo-route-1' },
    update: {},
    create: {
      id: 'demo-route-1',
      organizationId: managerOrg.id,
      serviceAreaId: dense.id,
      name: 'Rute Blok A (Demo)',
    },
  });
  const routeHouseholds = await prisma.household.findMany({
    where: { organizationId: managerOrg.id },
    orderBy: { accountNo: 'asc' },
    take: 8,
  });
  for (let index = 0; index < routeHouseholds.length; index += 1) {
    const household = routeHouseholds[index]!;
    await prisma.routeStop.upsert({
      where: { routeId_sequence: { routeId: route.id, sequence: index + 1 } },
      update: {},
      create: {
        routeId: route.id,
        householdId: household.id,
        sequence: index + 1,
        label: household.accountNo,
        address: household.displayAddress,
      },
    });
  }
  const vehicle = await prisma.collectionVehicle.upsert({
    where: { id: 'demo-vehicle-1' },
    update: {},
    create: {
      id: 'demo-vehicle-1',
      organizationId: managerOrg.id,
      label: 'Gerobak Motor 01 (Demo)',
      plateNumber: 'B 0001 DEMO',
      capacityKg: 500,
    },
  });
  const collectorProfileA = await prisma.collector.upsert({
    where: { userId: collectorA.id },
    update: {},
    create: {
      organizationId: managerOrg.id,
      userId: collectorA.id,
      employeeNo: 'PTG-DEMO-001',
      hiredAt: new Date('2026-01-01'),
    },
  });
  const collectorProfileB = await prisma.collector.upsert({
    where: { userId: collectorB.id },
    update: {},
    create: {
      organizationId: managerOrg.id,
      userId: collectorB.id,
      employeeNo: 'PTG-DEMO-002',
      hiredAt: new Date('2026-02-01'),
    },
  });
  for (const [collectorId, cardNumber, uid] of [
    [collectorProfileA.id, 'BG-DEMO-0001', '04A1B2C3D4'],
    [collectorProfileB.id, 'BG-DEMO-0002', '04D4C3B2A1'],
  ] as const) {
    await prisma.collectorCard.upsert({
      where: { cardNumber },
      update: {},
      create: { collectorId, cardNumber, uidHash: createHash('sha256').update(uid).digest('hex') },
    });
  }
  const run = await prisma.collectionRun.upsert({
    where: { id: 'demo-run-1' },
    update: {},
    create: {
      id: 'demo-run-1',
      organizationId: managerOrg.id,
      routeId: route.id,
      vehicleId: vehicle.id,
      scheduledFor: new Date('2026-08-13T07:00:00+07:00'),
      status: 'PLANNED',
    },
  });
  await prisma.routeAssignment.upsert({
    where: { runId_collectorId: { runId: run.id, collectorId: collectorProfileA.id } },
    update: {},
    create: { runId: run.id, collectorId: collectorProfileA.id, userId: collectorA.id },
  });

  const station = await prisma.weighStation.upsert({
    where: { id: 'demo-station-1' },
    update: {},
    create: {
      id: 'demo-station-1',
      organizationId: managerOrg.id,
      name: 'Stasiun Timbang TPS3R RW 08 (Demo)',
      address: 'TPS3R RW 08, Jakarta Timur (Demo)',
    },
  });
  const channel = await prisma.scaleChannel.upsert({
    where: { id: 'demo-scale-1' },
    update: {},
    create: {
      id: 'demo-scale-1',
      stationId: station.id,
      label: 'Simulator Timbangan Demo',
      source: 'SIMULATOR',
    },
  });
  const batch = await prisma.intakeBatch.upsert({
    where: { batchNo: 'DEMO-BATCH-100KG' },
    update: {},
    create: {
      organizationId: managerOrg.id,
      runId: run.id,
      stationId: station.id,
      batchNo: 'DEMO-BATCH-100KG',
      status: 'APPROVED',
      inputKg: 100,
      outputKg: 100,
      toleranceKg: 1,
      approvedAt: new Date(),
    },
  });
  const sorting = await prisma.sortingBatch.upsert({
    where: { id: 'demo-sorting-1' },
    update: {},
    create: {
      id: 'demo-sorting-1',
      organizationId: managerOrg.id,
      intakeBatchId: batch.id,
      status: 'APPROVED',
      approvedAt: new Date(),
    },
  });
  const weightEvents = [
    ['demo-weight-in', 'IN', 'MIXED', 100],
    ['demo-weight-organic', 'SORTED_OUTPUT', 'ORGANIC', 60],
    ['demo-weight-paper', 'SORTED_OUTPUT', 'PAPER', 20],
    ['demo-weight-residue', 'RESIDUE', 'MIXED', 20],
  ] as const;
  for (const [deviceEventId, direction, material, weightKg] of weightEvents) {
    await prisma.weightEvent.upsert({
      where: { deviceEventId },
      update: {},
      create: {
        intakeBatchId: batch.id,
        sortingBatchId: direction === 'IN' ? undefined : sorting.id,
        collectorId: collectorProfileA.id,
        scaleChannelId: channel.id,
        deviceEventId,
        direction,
        source: 'SIMULATOR',
        material,
        weightKg,
      },
    });
  }
  for (const [material, quantityKg] of [
    ['ORGANIC', 60],
    ['PAPER', 20],
  ] as const) {
    await prisma.materialInventoryLedger.upsert({
      where: {
        referenceType_referenceId_direction: {
          referenceType: `BATCH:${material}`,
          referenceId: batch.id,
          direction: 'CREDIT',
        },
      },
      update: {},
      create: {
        organizationId: managerOrg.id,
        material,
        direction: 'CREDIT',
        quantityKg,
        referenceType: `BATCH:${material}`,
        referenceId: batch.id,
      },
    });
  }
  await prisma.businessRequirement.upsert({
    where: { id: 'demo-requirement-organic' },
    update: {},
    create: {
      id: 'demo-requirement-organic',
      organizationId: businessOrg.id,
      title: 'Bahan baku kompos organik minimal 50 kg (Demo)',
      material: 'ORGANIC',
      quantityKg: 50,
      pricePerKg: 1000,
      region: 'Jabodetabek',
      status: 'PUBLISHED',
    },
  });
  const demoLot = await prisma.materialLot.upsert({
    where: { code: 'DEMO-LOT-ORGANIC-001' },
    update: {},
    create: {
      organizationId: managerOrg.id,
      code: 'DEMO-LOT-ORGANIC-001',
      material: 'ORGANIC',
      quantityKg: 50,
      availableKg: 50,
      pricePerKg: 1000,
      status: 'PUBLISHED',
    },
  });
  await prisma.materialInventoryLedger.upsert({
    where: {
      referenceType_referenceId_direction: {
        referenceType: 'MATERIAL_LOT',
        referenceId: demoLot.id,
        direction: 'RESERVE',
      },
    },
    update: {},
    create: {
      organizationId: managerOrg.id,
      material: 'ORGANIC',
      direction: 'RESERVE',
      quantityKg: 50,
      referenceType: 'MATERIAL_LOT',
      referenceId: demoLot.id,
    },
  });

  for (let index = 1; index <= 12; index += 1) {
    await prisma.facility.upsert({
      where: { id: `demo-facility-${index}` },
      update: {},
      create: {
        id: `demo-facility-${index}`,
        organizationId: index <= 2 ? managerOrg.id : undefined,
        name: `${index <= 2 ? 'TPS3R' : 'Titik Setor'} Demo ${index}`,
        operatorName: index <= 2 ? managerOrg.name : `Operator Fiktif ${index} (Demo)`,
        address: `Alamat Fasilitas ${index}, DKI Jakarta (Demo)`,
        lat: -6.2 + index * 0.005,
        lng: 106.82 + index * 0.006,
        sourceUrl: 'https://example.com/demo-facility-source',
        verifiedAt: new Date('2026-08-12T00:00:00+07:00'),
        openingNote: '08.00 sampai 16.00 (Demo)',
        demo: true,
        materialRules: {
          create: [
            {
              material: index % 2 ? 'ORGANIC' : 'PAPER',
              accepted: true,
              preparation: 'Pisahkan limbah B3 sebelum disetor.',
            },
          ],
        },
      },
    });
  }
  const report = await prisma.wasteReport.upsert({
    where: { id: 'demo-waste-report-1' },
    update: {
      photoKey:
        'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1200&q=80',
    },
    create: {
      id: 'demo-waste-report-1',
      organizationId: managerOrg.id,
      reporterId: householdUser.id,
      status: 'SUBMITTED',
      description: 'Tumpukan sampah liar di tepi jalan (Demo)',
      address: 'Jalan Lingkungan RW 08 (Demo)',
      lat: -6.205,
      lng: 106.941,
      photoKey:
        'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1200&q=80',
    },
  });
  if ((await prisma.wasteReportEvent.count({ where: { reportId: report.id } })) === 0) {
    await prisma.wasteReportEvent.create({
      data: {
        reportId: report.id,
        actorId: householdUser.id,
        status: 'SUBMITTED',
        note: 'Laporan demo dibuat warga',
      },
    });
  }

  const materialCategories = [
    [
      'ORGANIC',
      'Organik',
      'Sisa makanan, daun, dan bahan organik yang dapat diolah.',
      'Pisahkan dari kemasan dan cairan berlebih.',
      'leaf',
      1,
    ],
    [
      'PAPER',
      'Kertas dan Kardus',
      'Kertas dan kardus yang bersih serta kering.',
      'Lipat kardus dan jaga agar tetap kering.',
      'file-text',
      2,
    ],
    [
      'PET',
      'Plastik PET',
      'Botol dan kemasan plastik berkode PET.',
      'Kosongkan, bilas, dan pisahkan tutup bila diminta.',
      'droplet',
      3,
    ],
    [
      'HDPE',
      'Plastik HDPE',
      'Kemasan plastik kaku berkode HDPE.',
      'Kosongkan isi dan bersihkan sisa produk.',
      'box',
      4,
    ],
    [
      'METAL',
      'Logam',
      'Kaleng dan logam yang aman untuk ditangani.',
      'Kosongkan isi dan hindari bagian tajam terbuka.',
      'tool',
      5,
    ],
    [
      'GLASS',
      'Kaca',
      'Botol atau wadah kaca yang diterima fasilitas.',
      'Kemas pecahan secara aman dan beri penanda.',
      'hexagon',
      6,
    ],
  ] as const;
  for (const [
    code,
    publicName,
    description,
    preparation,
    icon,
    displayOrder,
  ] of materialCategories) {
    await prisma.materialCategoryMetadata.upsert({
      where: { code },
      update: { publicName, description, preparation, icon, displayOrder },
      create: { code, publicName, description, preparation, icon, displayOrder },
    });
  }

  await prisma.serviceArea.upsert({
    where: { id: 'demo-area-archived' },
    update: {
      status: 'INACTIVE',
      archivedAt: new Date('2026-08-01T00:00:00+07:00'),
      archivedBy: manager.id,
      archiveReason: 'Data Demo untuk pengujian restore',
    },
    create: {
      id: 'demo-area-archived',
      organizationId: managerOrg.id,
      name: 'Wilayah Arsip (Demo)',
      region: 'Jakarta Timur (Demo)',
      status: 'INACTIVE',
      archivedAt: new Date('2026-08-01T00:00:00+07:00'),
      archivedBy: manager.id,
      archiveReason: 'Data Demo untuk pengujian restore',
    },
  });
  await prisma.businessRequirement.upsert({
    where: { id: 'demo-requirement-draft' },
    update: { status: 'DRAFT' },
    create: {
      id: 'demo-requirement-draft',
      organizationId: businessOrg.id,
      title: 'Draft kebutuhan kertas (Demo)',
      material: 'PAPER',
      quantityKg: 25,
      region: 'Jakarta Timur',
      status: 'DRAFT',
    },
  });
  await prisma.materialLot.upsert({
    where: { code: 'DEMO-LOT-DRAFT-001' },
    update: { status: 'DRAFT' },
    create: {
      organizationId: managerOrg.id,
      code: 'DEMO-LOT-DRAFT-001',
      material: 'PAPER',
      quantityKg: 10,
      availableKg: 10,
      pricePerKg: 750,
      status: 'DRAFT',
    },
  });
  const existingTicket = await prisma.supportTicket.findFirst({
    where: { createdById: manager.id, subject: 'Bantuan sinkronisasi Demo' },
  });
  if (!existingTicket) {
    await prisma.supportTicket.create({
      data: {
        organizationId: managerOrg.id,
        createdById: manager.id,
        subject: 'Bantuan sinkronisasi Demo',
        description: 'Periksa status sinkronisasi perangkat timbang Demo.',
        messages: {
          create: {
            authorId: manager.id,
            message: 'Periksa status sinkronisasi perangkat timbang Demo.',
          },
        },
      },
    });
  }
  if ((await prisma.auditEvent.count()) === 0) {
    await prisma.auditEvent.create({
      data: {
        actorId: admin.id,
        organizationId: managerOrg.id,
        action: 'DEMO_SEED_CREATED',
        resourceType: 'System',
        resourceId: 'demo',
        reason: 'Data fiktif untuk demonstrasi GEMASTIK PPL',
      },
    });
  }

  console.log('\nBinGo Pivot Demo siap. Semua akun memakai password:', PASSWORD);
  console.table(
    [
      ['Admin BinGo', '+6281100000001'],
      ['Pengelola', '+6281100000002'],
      ['Petugas', '+6281100000004'],
      ['Warga', '+6281100000006'],
      ['Business', '+6281100000007'],
      ['Pemohon Pengelola', '+6281100000009'],
      ['Pemohon Business', '+6281100000010'],
    ].map(([role, phone]) => ({ role, phone })),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
