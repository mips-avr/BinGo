/* Data contoh untuk QC. Bentuknya mengikuti DTO di packages/shared-types. */
const now = new Date('2026-08-06T09:15:00.000Z');
const iso = (minsAgo) => new Date(now.getTime() - minsAgo * 60000).toISOString();

const CITIZEN = {
  id: 'u-citizen-001',
  name: 'Budi Santoso',
  phone: '081111111111',
  role: 'CITIZEN',
  pointsBalance: 1275,
  verificationLevel: 0,
  createdAt: iso(60 * 24 * 90),
};
const AGENT = {
  id: 'u-agent-001',
  name: 'Agus Pramono',
  phone: '082222222222',
  role: 'WASTE_AGENT',
  pointsBalance: 0,
  verificationLevel: 1,
  createdAt: iso(60 * 24 * 120),
};
const MSME = {
  id: 'u-msme-001',
  name: 'Siti Rahayu',
  phone: '083333333333',
  role: 'MSME',
  pointsBalance: 0,
  verificationLevel: 0,
  createdAt: iso(60 * 24 * 60),
};

const pickup = (o) => ({
  id: o.id,
  citizenId: CITIZEN.id,
  agentId: o.agentId ?? null,
  status: o.status,
  location: { lat: o.lat, lng: o.lng },
  address: o.address,
  materialType: o.materialType,
  estimatedWeightKg: o.weight,
  notes: o.notes ?? null,
  createdAt: iso(o.age),
  updatedAt: iso(Math.max(0, o.age - 20)),
});

const PICKUPS = [
  pickup({ id: 'p-001', status: 'ACCEPTED', agentId: AGENT.id, lat: -6.3841, lng: 106.8294,
    address: 'Jl. Margonda Raya No. 358, Kecamatan Beji, Depok', materialType: 'PET',
    weight: 4.5, notes: 'Botol sudah dibilas dan tutupnya dilepas.', age: 90 }),
  pickup({ id: 'p-002', status: 'PENDING', lat: -6.3722, lng: 106.8331,
    address: 'Jl. Kemiri Raya No. 12, Kecamatan Beji, Depok', materialType: 'PAPER',
    weight: 12, notes: 'Kardus pindahan, sudah dilipat.', age: 25 }),
  pickup({ id: 'p-003', status: 'COMPLETED', agentId: AGENT.id, lat: -6.3908, lng: 106.8177,
    address: 'Jl. Palakali No. 7, Kecamatan Beji, Depok', materialType: 'METAL',
    weight: 2.1, notes: null, age: 60 * 26 }),
  pickup({ id: 'p-004', status: 'CANCELLED', lat: -6.3777, lng: 106.8412,
    address: 'Jl. Bukit Cinere Raya No. 90, Kecamatan Beji, Depok', materialType: 'MIXED',
    weight: 6, notes: 'Batal, keburu diambil pemulung langganan.', age: 60 * 50 }),
];

const radar = (o) => ({
  ...pickup(o),
  distanceMeters: o.dist,
  bearingDegrees: o.bearing,
  citizenName: o.citizenName,
  ageMinutes: o.age,
  ageLabel: o.age < 5 ? 'baru saja' : o.age < 60 ? `${o.age} menit lalu` : `${Math.round(o.age / 60)} jam lalu`,
  highValue: o.weight >= 20,
});

const RADAR = [
  radar({ id: 'r-001', status: 'PENDING', lat: -6.3722, lng: 106.8331, address: 'Jl. Kemiri Raya No. 12, Beji',
    materialType: 'PAPER', weight: 12, dist: 420, bearing: 38, citizenName: 'Dewi Lestari', age: 12 }),
  radar({ id: 'r-002', status: 'PENDING', lat: -6.3865, lng: 106.8388, address: 'Jl. Kukusan Teknik No. 4, Beji',
    materialType: 'PET', weight: 5.5, dist: 980, bearing: 118, citizenName: 'Rina Wulandari', age: 3 }),
  radar({ id: 'r-003', status: 'PENDING', lat: -6.3955, lng: 106.8206, address: 'Jl. Haji Amat No. 21, Beji',
    materialType: 'METAL', weight: 24, dist: 1650, bearing: 212, citizenName: 'Hendra Gunawan', age: 47 }),
  radar({ id: 'r-004', status: 'PENDING', lat: -6.3702, lng: 106.8195, address: 'Jl. Sawo Raya No. 33, Beji',
    materialType: 'HDPE', weight: 3.2, dist: 2400, bearing: 305, citizenName: 'Tono Wijaya', age: 130 }),
  radar({ id: 'r-005', status: 'PENDING', lat: -6.3812, lng: 106.8262, address: 'Jl. Melati No. 8, Beji',
    materialType: 'GLASS', weight: 8.4, dist: 640, bearing: 268, citizenName: 'Sri Handayani', age: 68 }),
];

const line = (o) => ({
  id: o.id,
  grade: o.grade,
  weightKg: o.w,
  deductionKg: o.dk ?? 0,
  deductionReason: o.reason ?? null,
  netWeightKg: o.w - (o.dk ?? 0),
  pricePerKg: o.price,
  deductionAmount: o.da ?? 0,
  grossAmount: Math.round((o.w - (o.dk ?? 0)) * o.price),
  subtotal: Math.round((o.w - (o.dk ?? 0)) * o.price) - (o.da ?? 0),
});

const RECEIPT_FULL = {
  id: 'w-001',
  receiptNo: 'BG-260806-4KQ2',
  pickupRequestId: 'p-001',
  sellerId: CITIZEN.id,
  issuedById: AGENT.id,
  partnerName: 'Bank Sampah Melati',
  scaleTeraNo: 'DKI-2025-114873',
  scaleVerified: true,
  region: 'Kecamatan Beji, Depok',
  regionKey: 'beji depok',
  walkIn: false,
  lines: [
    line({ id: 'l-1', grade: 'PET_BOTOL_BENING', w: 4.5, price: 3600, dk: 0.3, reason: 'Masih ada sisa air di dalam botol', da: 0 }),
    line({ id: 'l-2', grade: 'KERTAS_KARDUS', w: 6.2, price: 1500, da: 900, reason: 'Kardus lembap di bagian bawah' }),
    line({ id: 'l-3', grade: 'LOGAM_KALENG', w: 1.4, price: 11500 }),
  ],
  totalWeightKg: 12.1,
  totalDeductionKg: 0.3,
  totalNetWeightKg: 11.8,
  totalGrossAmount: 40430,
  totalDeductionAmount: 900,
  totalNetAmount: 39530,
  notes: 'Serah terima di depan rumah, dibayar tunai.',
  disputedAt: null,
  disputeReason: null,
  createdAt: iso(75),
};

const RECEIPT_WALKIN = {
  ...RECEIPT_FULL,
  id: 'w-002',
  receiptNo: 'BG-260805-JRV5',
  pickupRequestId: null,
  walkIn: true,
  partnerName: 'Lapak Pak Slamet',
  scaleTeraNo: 'DKI-2024-990211',
  lines: [line({ id: 'l-4', grade: 'PP_GELAS_BENING', w: 9.8, price: 5200 })],
  totalWeightKg: 9.8, totalDeductionKg: 0, totalNetWeightKg: 9.8,
  totalGrossAmount: 50960, totalDeductionAmount: 0, totalNetAmount: 50960,
  notes: null,
  createdAt: iso(60 * 25),
};

const RECEIPT_NOTERA = {
  ...RECEIPT_FULL,
  id: 'w-003',
  receiptNo: 'BG-260804-ZG56',
  pickupRequestId: 'p-003',
  walkIn: false,
  partnerName: 'Lapak Bu Yanti',
  scaleTeraNo: null,
  scaleVerified: false,
  lines: [line({ id: 'l-5', grade: 'PP_GELAS_WARNA', w: 5.1, price: 2600 })],
  totalWeightKg: 5.1, totalDeductionKg: 0, totalNetWeightKg: 5.1,
  totalGrossAmount: 13260, totalDeductionAmount: 0, totalNetAmount: 13260,
  notes: 'Timbangan lapak belum ditera.',
  createdAt: iso(60 * 49),
};

const RECEIPTS = [RECEIPT_FULL, RECEIPT_WALKIN, RECEIPT_NOTERA];

const band = (grade, label, p25, median, p75, samples, partners, age) => ({
  grade, label, region: 'Kecamatan Beji, Depok', regionKey: 'beji depok',
  p25, median, p75, sampleCount: samples, partnerCount: partners, lastReportedAt: iso(age),
});

const PRICE_BOARD = {
  region: 'Kecamatan Beji, Depok',
  regionKey: 'beji depok',
  windowDays: 7,
  bands: [
    band('PP_GELAS_BENING', 'Gelas plastik bening', 1500, 1800, 2100, 5, 3, 180),
    band('PET_BOTOL_BENING', 'Botol PET bening', 3225, 3450, 3750, 4, 3, 300),
    band('KERTAS_KARDUS', 'Kardus', 1363, 1500, 1675, 4, 2, 640),
    band('LOGAM_KALENG', 'Kaleng minuman', 11250, 11750, 12375, 3, 2, 1500),
  ],
  insufficient: ['LOGAM_ALUMINIUM', 'KACA_BELING'],
};

const REGIONS = [
  { label: 'Kecamatan Beji, Depok', regionKey: 'beji depok', receiptCount: 14 },
  { label: 'Kecamatan Cimanggis, Depok', regionKey: 'cimanggis depok', receiptCount: 2 },
  { label: 'Kecamatan Sukmajaya, Depok', regionKey: 'sukmajaya depok', receiptCount: 11 },
];

const report = (o) => ({
  id: o.id,
  citizenId: CITIZEN.id,
  status: o.status,
  location: { lat: o.lat, lng: o.lng },
  description: o.desc,
  imageUrl: o.img,
  verificationCount: o.v,
  createdAt: iso(o.age),
  updatedAt: iso(Math.max(0, o.age - 30)),
});

const IMG_A = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAwICQsJCAwLCgsODQwOEh4UEhEREiUbHBYeLCcuLisnKyoxN0Y7MTRCNCorPVM+QkhKTk9OLztWXFVMW0ZNTkv/2wBDAQ0ODhIQEiQUFCRLMisyS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0v/wAARCAFAAeADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwB9FFFYkBRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAN8xP76/nR5if31/OqG7/AG2o3f7bUwL/AJif31/OjzE/vr+dUN3+21G7/bagC/5if31/OjzE/vr+dUN3+21G7/bagC/5if31/OjzE/vr+dUN3+21G7/bagC/5if31/Oj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';
const REPORTS = [
  report({ id: 'rp-001', status: 'DILAPORKAN', lat: -6.3801, lng: 106.8288,
    desc: 'Tumpukan sampah rumah tangga di bahu jalan, sudah tiga hari tidak diangkut.', img: IMG_A, v: 1, age: 200 }),
  report({ id: 'rp-002', status: 'DIVERIFIKASI', lat: -6.3744, lng: 106.8351,
    desc: 'Sampah kemasan menumpuk di saluran air belakang pasar.', img: IMG_A, v: 3, age: 60 * 20 }),
  report({ id: 'rp-003', status: 'SELESAI', lat: -6.3899, lng: 106.8203,
    desc: null, img: IMG_A, v: 4, age: 60 * 72 }),
];

const item = (o) => ({
  id: o.id, supplierName: o.sup, itemName: o.name, description: o.desc,
  price: o.price, minOrderQty: o.moq, stock: o.stock, imageUrl: o.img ?? null, createdAt: iso(60 * 24 * 20),
});
const ITEMS = [
  item({ id: 'i-001', sup: 'CV Kemasan Lestari', name: 'Kantong Kraft Coklat 500 gr',
    desc: 'Kantong kertas kraft food-grade, cocok untuk roti dan gorengan. Tanpa lapisan plastik sehingga mudah dipulihkan.',
    price: 850, moq: 500, stock: 12000 }),
  item({ id: 'i-002', img: IMG_A, sup: 'PT Bagasse Nusantara', name: 'Kotak Bagasse 2 Sekat',
    desc: 'Kotak makan dari ampas tebu, tahan minyak dan panas hingga 100 derajat Celsius.',
    price: 1450, moq: 300, stock: 6400 }),
  item({ id: 'i-003', sup: 'Rekan Daur Ulang', name: 'Gelas rPET 12 oz + Tutup',
    desc: 'Gelas dari PET daur ulang bersertifikat food-grade, bening dan kaku.',
    price: 1200, moq: 1000, stock: 300 }),
  item({ id: 'i-004', sup: 'CV Kemasan Lestari', name: 'Sedotan Bambu 20 cm',
    desc: 'Sedotan bambu dapat dipakai ulang, dikemas per 50 batang.',
    price: 2500, moq: 100, stock: 1800 }),
];

const TRANSACTIONS = [
  { id: 't-001', buyerId: MSME.id, itemId: 'i-001', qty: 1000, totalPrice: 850000, status: 'PAID', createdAt: iso(60 * 30), item: ITEMS[0] },
  { id: 't-002', buyerId: MSME.id, itemId: 'i-002', qty: 300, totalPrice: 435000, status: 'SHIPPED', createdAt: iso(60 * 96), item: ITEMS[1] },
  { id: 't-003', buyerId: MSME.id, itemId: 'i-004', qty: 200, totalPrice: 500000, status: 'COMPLETED', createdAt: iso(60 * 240), item: ITEMS[3] },
];

const VERIFICATION = {
  agentId: AGENT.id,
  level: 1,
  approvedCount: 1,
  distinctInstitutionCount: 1,
  disputelessTransactionCount: 6,
  peerEndorsementCount: 1,
  criteria: { secondInstitution: false, disputelessTransactions: false, peerEndorsement: false },
  criteriaMetCount: 0,
  canAcceptJobs: true,
  canIssueReceipts: true,
  canTakeHighValueJobs: false,
  verifications: [
    {
      id: 'av-001', agentId: AGENT.id, attestorId: 'u-partner-001',
      attestorType: 'BANK_SAMPAH', attestorName: 'Bank Sampah Melati', attestorPhone: '081234500031',
      status: 'DISETUJUI', requestedAt: iso(60 * 24 * 30), decidedAt: iso(60 * 24 * 29),
      note: 'Sudah dikenal pengurus sejak 2024.',
      events: [
        { action: 'DIAJUKAN', actorId: AGENT.id, note: null, createdAt: iso(60 * 24 * 30) },
        { action: 'DISETUJUI', actorId: 'u-partner-001', note: 'Sudah dikenal pengurus sejak 2024.', createdAt: iso(60 * 24 * 29) },
      ],
    },
  ],
};

module.exports = { CITIZEN, AGENT, MSME, PICKUPS, RADAR, RECEIPTS, RECEIPT_FULL, PRICE_BOARD, REGIONS, REPORTS, ITEMS, TRANSACTIONS, VERIFICATION };
