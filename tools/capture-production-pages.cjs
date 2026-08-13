/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer-core');

const baseUrl = process.env.BINGO_WEB_URL || 'https://bingo-web-delta.vercel.app';
const outputDir = path.resolve(
  process.argv[2] || path.join(process.cwd(), 'artifacts/screenshots/production'),
);
const chromePath =
  process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const password = 'demo12345678';
const manifest = [];

const accounts = {
  platform: { phone: '+6281100000001', viewport: { width: 1440, height: 1000 } },
  manager: { phone: '+6281100000002', viewport: { width: 1440, height: 1000 } },
  collector: {
    phone: '+6281100000004',
    viewport: { width: 390, height: 844, deviceScaleFactor: 1 },
  },
  household: {
    phone: '+6281100000006',
    viewport: { width: 390, height: 844, deviceScaleFactor: 1 },
  },
  business: { phone: '+6281100000007', viewport: { width: 1440, height: 1000 } },
};

const webNavigation = {
  platform: [
    'Ringkasan Platform',
    'Antrean Verifikasi',
    'Organisasi',
    'Business',
    'Fasilitas',
    'Kategori Material',
    'Moderasi',
    'Audit',
    'Bantuan',
  ],
  manager: [
    'Ringkasan',
    'Wilayah dan Pelanggan',
    'Tagihan',
    'Kalender dan Rute',
    'Petugas dan Kartu',
    'Timbang dan Pemilahan',
    'Material',
    'Pesanan',
    'Fasilitas',
    'Laporan',
    'Bantuan',
    'Pengaturan',
  ],
  business: [
    'Ringkasan',
    'Kebutuhan Material',
    'Pasokan',
    'Pesanan',
    'Penerimaan',
    'Riwayat',
    'Profil dan Verifikasi',
    'Bantuan',
  ],
};

const hiddenManagerRoutes = [
  ['rumah-tangga', '/households'],
  ['paket-layanan', '/service-plans'],
  ['langganan', '/subscriptions'],
  ['kalender', '/calendars'],
  ['tugas-pengumpulan', '/runs'],
  ['kendaraan', '/vehicles'],
  ['stasiun-timbang', '/weigh-stations'],
  ['operasional', '/operations'],
];

function slug(value) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function settle(page) {
  await page.waitForNetworkIdle({ idleTime: 500, timeout: 12000 }).catch(() => undefined);
  await new Promise((resolve) => setTimeout(resolve, 700));
}

async function capture(page, group, name) {
  const groupDir = path.join(outputDir, group);
  fs.mkdirSync(groupDir, { recursive: true });
  const index = String(manifest.length + 1).padStart(3, '0');
  const filename = `${index}-${slug(name)}.png`;
  const target = path.join(groupDir, filename);
  await page.screenshot({ path: target, fullPage: true });
  manifest.push({
    index: Number(index),
    group,
    name,
    route: new URL(page.url()).pathname,
    viewport: page.viewport(),
    file: path.relative(outputDir, target),
  });
  console.log(`${index} ${group}: ${name}`);
}

async function clickExact(page, label, roles = ['button', 'tab']) {
  const clicked = await page.evaluate(
    ({ expected, allowedRoles }) => {
      const normalize = (value) => value?.replace(/\s+/g, ' ').trim();
      const selector = ['button', 'a', ...allowedRoles.map((role) => `[role="${role}"]`)].join(',');
      const candidates = [...document.querySelectorAll(selector)].filter((element) =>
        normalize(element.textContent)?.includes(expected),
      );
      const target = candidates.sort(
        (left, right) =>
          (normalize(left.textContent)?.length ?? 9999) -
          (normalize(right.textContent)?.length ?? 9999),
      )[0];
      if (!target) return false;
      target.click();
      return true;
    },
    { expected: label, allowedRoles: roles },
  );
  if (!clicked) throw new Error(`Tombol/tab tidak ditemukan: ${label}`);
  await settle(page);
}

async function login(browser, role) {
  const account = accounts[role];
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport(account.viewport);
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await settle(page);
  const inputs = await page.$$('input');
  if (inputs.length < 2) throw new Error(`Form login tidak ditemukan untuk ${role}`);
  await inputs[0].type(account.phone);
  await inputs[1].type(password);
  const submit = await page.$('[data-testid="login-submit"]');
  if (submit) await submit.click();
  else await clickExact(page, 'Masuk', ['button']);
  await page.waitForFunction(() => !location.pathname.includes('login'), { timeout: 20000 });
  await settle(page);
  return { context, page };
}

async function captureAuth(browser, viewport, group) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport(viewport);
  const routes = [
    ['Masuk', '/login'],
    ['Pilih Peran', '/role-select'],
    ['Daftar Warga', '/register?role=HOUSEHOLD'],
    ['Daftar Pengelola', '/register?role=MANAGER_ADMIN'],
    ['Daftar Business', '/register?role=BUSINESS_BUYER'],
  ];
  for (const [name, route] of routes) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await settle(page);
    await capture(page, group, name);
  }
  await context.close();
}

async function captureWebRole(browser, role) {
  const { context, page } = await login(browser, role);
  for (const label of webNavigation[role]) {
    if (label !== webNavigation[role][0]) await clickExact(page, label, ['button']);
    await capture(page, role, label);
  }
  if (role === 'manager') {
    for (const [name, route] of hiddenManagerRoutes) {
      await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await settle(page);
      await capture(page, role, name);
    }
  }
  if (role === 'business') {
    await page.goto(`${baseUrl}/catalog`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await settle(page);
    await capture(page, role, 'Katalog Pasokan');
  }
  await context.close();
}

async function captureMobileRole(browser, role, labels) {
  const { context, page } = await login(browser, role);
  for (const label of labels) {
    if (label !== labels[0]) await clickExact(page, label, ['tab', 'button']);
    await capture(page, role, label);
  }
  if (role === 'household') {
    await page.goto(`${baseUrl}/reports/new`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await settle(page);
    await capture(page, role, 'Buat Laporan');
    await page.goto(`${baseUrl}/reports/demo-waste-report-1`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await settle(page);
    await capture(page, role, 'Detail Laporan');
  }
  await context.close();
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars'],
  });
  try {
    await captureAuth(browser, { width: 1440, height: 1000 }, 'auth-web');
    await captureAuth(browser, { width: 390, height: 844, deviceScaleFactor: 1 }, 'auth-mobile');
    await captureWebRole(browser, 'platform');
    await captureWebRole(browser, 'manager');
    await captureWebRole(browser, 'business');
    await captureMobileRole(browser, 'household', [
      'Beranda',
      'Layanan',
      'Jalur Setor',
      'Laporan',
      'Akun',
    ]);
    await captureMobileRole(browser, 'collector', [
      'Hari Ini',
      'Rute',
      'Timbang',
      'Riwayat',
      'Akun',
    ]);
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  const rows = manifest
    .map(
      (item) =>
        `| ${item.index} | ${item.group} | ${item.name} | \`${item.route}\` | [PNG](${item.file}) |`,
    )
    .join('\n');
  fs.writeFileSync(
    path.join(outputDir, 'README.md'),
    `# Screenshot Production BinGo\n\nDibuat dari ${baseUrl}. Halaman mobile memakai viewport 390 × 844, sedangkan dashboard web memakai 1440 × 1000.\n\n| No. | Kelompok | Halaman | Route | File |\n|---:|---|---|---|---|\n${rows}\n`,
  );
  console.log(`\n${manifest.length} screenshot tersimpan di ${outputDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
