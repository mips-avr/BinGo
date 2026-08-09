/* Ambil tangkapan layar seluruh layar BinGo untuk QC. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const F = require('./fixtures');

const ROOT = '../../apps/mobile/.qc-web';
const OUT = './shots';
const PORT = 4173;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };

function serve() {
  return http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    let file = path.join(ROOT, url);
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(ROOT, 'index.html');
    const ext = path.extname(file);

    if (ext === '.html') {
      /*
       * Expo SDK 54 memancarkan bundel web yang memakai `import.meta`, tetapi
       * tag skrip yang ditulisnya adalah skrip klasik `<script defer>`. Di
       * peramban, kombinasi itu gagal seketika dengan "Cannot use 'import.meta'
       * outside a module" dan SETIAP halaman menjadi putih — termasuk halaman
       * yang sebenarnya baik-baik saja.
       *
       * Diperbaiki di sini, bukan dengan menyunting berkas hasil ekspor, supaya
       * `expo export` tetap boleh dijalankan ulang kapan saja tanpa kehilangan
       * tambalan ini.
       */
      let html = fs.readFileSync(file, 'utf8');
      html = html.replace(/<script src=/g, '<script type="module" src=');
      res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' });
      res.end(html);
      return;
    }

    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  }).listen(PORT);
}

/*
 * `body { overflow: hidden }` adalah bagian dari reset react-native-web, jadi
 * `window.scrollTo` tidak menggerakkan apa pun. Yang benar-benar menggulir
 * adalah div dalam milik <ScrollView>. Cari yang paling tinggi isinya.
 */
const SCROLL_TO_BOTTOM = () => {
  const nodes = Array.from(document.querySelectorAll('div'));
  let best = null;
  for (const n of nodes) {
    if (n.scrollHeight > n.clientHeight + 40 && (!best || n.scrollHeight > best.scrollHeight)) best = n;
  }
  if (best) best.scrollTop = best.scrollHeight;
  return best ? best.scrollHeight : 0;
};

const json = (route, body, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(body) });

async function installApi(page, user) {
  await page.route('**/api/v1/**', async (route) => {
    const u = new URL(route.request().url());
    const p = u.pathname;
    const m = route.request().method();
    if (m === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' } });

    if (p.endsWith('/auth/me') || p.endsWith('/users/me')) return json(route, user);
    if (p.endsWith('/auth/login') || p.endsWith('/auth/register'))
      return json(route, { user, token: { accessToken: 'qc-token', expiresIn: 604800 } }, 201);

    if (p.endsWith('/pickup-requests/mine')) return json(route, F.PICKUPS);
    if (p.endsWith('/pickup-requests/assigned')) return json(route, F.PICKUPS.filter((x) => x.agentId));
    if (p.endsWith('/pickup-requests/radar')) return json(route, F.RADAR);
    if (p.endsWith('/pickup-requests/nearby')) return json(route, F.RADAR.map(({ bearingDegrees, citizenName, ageMinutes, ageLabel, highValue, ...r }) => r));
    if (/\/pickup-requests\/[^/]+$/.test(p)) {
      const id = p.split('/').pop();
      return json(route, F.PICKUPS.find((x) => x.id === id) || F.RADAR.find((x) => x.id === id) || F.PICKUPS[0]);
    }

    if (p.endsWith('/weighing-receipts/regions')) return json(route, F.REGIONS);
    if (p.endsWith('/weighing-receipts/price-board')) return json(route, F.PRICE_BOARD);
    if (p.endsWith('/weighing-receipts/mine')) return json(route, F.RECEIPTS);
    if (/\/weighing-receipts\/[^/]+$/.test(p)) {
      const id = p.split('/').pop();
      return json(route, F.RECEIPTS.find((x) => x.id === id) || F.RECEIPT_FULL);
    }

    if (p.endsWith('/reports/mine')) return json(route, F.REPORTS);
    if (p.endsWith('/reports')) return json(route, F.REPORTS);
    if (/\/reports\/[^/]+$/.test(p)) {
      const id = p.split('/').pop();
      return json(route, F.REPORTS.find((x) => x.id === id) || F.REPORTS[0]);
    }

    if (p.endsWith('/marketplace/items')) return json(route, F.ITEMS);
    if (/\/marketplace\/items\/[^/]+$/.test(p)) {
      const id = p.split('/').pop();
      return json(route, F.ITEMS.find((x) => x.id === id) || F.ITEMS[0]);
    }
    if (p.endsWith('/marketplace/transactions/mine')) return json(route, F.TRANSACTIONS);

    if (p.includes('/agent-verifications')) return json(route, F.VERIFICATION);

    if (p.endsWith('/drop-points/nearby') || p.endsWith('/drop-points')) return json(route, F.DROP_POINTS);
    if (p.endsWith('/member-cards/lookup')) return json(route, F.CARD_TAP);
    if (p.endsWith('/member-cards')) return json(route, F.CARDS);

    return json(route, {});
  });
}

const SCREENS = {
  auth: [
    ['01-login', '/(auth)/login'],
    ['02-pilih-peran', '/(auth)/role-select'],
    ['03-registrasi', '/(auth)/register?role=CITIZEN'],
  ],
  citizen: [
    ['10-beranda-warga', '/(tabs)/'],
    ['11-trashscan', '/(tabs)/scanner'],
    ['12-hasil-pindai-yakin', '/(tabs)/scanner/result?materialType=PET&source=resin-code&confident=1&resinCode=1&disposalTip=Bilas%20botol%2C%20lepas%20tutup%20dan%20label%2C%20lalu%20pipihkan%20agar%20tidak%20memakan%20tempat.&pointsHint=25'],
    ['13-hasil-pindai-abstain', '/(tabs)/scanner/result?materialType=MIXED&source=visual-estimate&confident=0&visualScore=0.18&disposalTip=&pointsHint=0'],
    // Bagian bawah layar hasil: kategori pilah wajib, harga, dan titik setor.
    // Butuh gulir karena tiga kartu itu ada di bawah lipatan.
    ['12b-hasil-pindai-kategori-dan-harga', '/(tabs)/scanner/result?materialType=PET&source=resin-code&confident=1&resinCode=1&disposalTip=Bilas%20botol%2C%20lepas%20tutup%20dan%20label%2C%20lalu%20pipihkan%20agar%20tidak%20memakan%20tempat.&pointsHint=25#at=Perkiraan%20harga'],
    ['12c-hasil-pindai-titik-setor', '/(tabs)/scanner/result?materialType=PET&source=resin-code&confident=1&resinCode=1&disposalTip=Bilas%20botol%2C%20lepas%20tutup%20dan%20label%2C%20lalu%20pipihkan%20agar%20tidak%20memakan%20tempat.&pointsHint=25#at=Titik%20setor%20terdekat'],
    ['14-permintaan-saya', '/(tabs)/pickups'],
    ['15-permintaan-baru', '/(tabs)/pickups/new'],
    ['16-detail-permintaan', '/(tabs)/pickups/p-001'],
    ['17-papan-harga-warga', '/(tabs)/prices'],
    ['18-laporan-komunitas', '/(tabs)/reports'],
    ['19-laporan-baru', '/(tabs)/reports/new'],
    ['20-detail-laporan', '/(tabs)/reports/rp-002'],
    ['21-wastemart-warga', '/(tabs)/marketplace'],
    ['22-detail-produk-warga', '/(tabs)/marketplace/i-002'],
    ['23-bukti-timbang-saya', '/(tabs)/receipts'],
    ['24-detail-bukti-timbang', '/(tabs)/receipts/w-001'],
    ['25-profil-warga', '/(tabs)/profile'],
    ['26-halaman-tidak-ditemukan', '/rute-yang-tidak-ada'],
  ],
  agent: [
    ['30-dasbor-pemulung', '/(agent-tabs)/'],
    ['31-radar-geospasial', '/(agent-tabs)/nearby'],
    ['32-pekerjaan-saya', '/(agent-tabs)/jobs'],
    ['33-detail-pekerjaan', '/(agent-tabs)/jobs/p-001'],
    ['34-papan-harga-pemulung', '/(agent-tabs)/prices'],
    ['35-bukti-diterbitkan', '/(agent-tabs)/receipts'],
    ['36-terbitkan-bukti-timbang', '/(agent-tabs)/receipts/new?sellerId=u-citizen-001&pickupRequestId=p-001&region=Kecamatan%20Beji%2C%20Depok'],
    ['37-detail-bukti-walkin', '/(agent-tabs)/receipts/w-002'],
    ['38-antrean-laporan', '/(agent-tabs)/reports'],
    ['39-detail-laporan-pemulung', '/(agent-tabs)/reports/rp-002'],
    ['40-profil-pemulung', '/(agent-tabs)/profile'],
    ['41-kartu-mitra-konter', '/(agent-tabs)/cards'],
    ['42-kartu-mitra-terbitkan', '/(agent-tabs)/cards#terbitkan'],
    ['43-kartu-mitra-hasil-tap', '/(agent-tabs)/cards#tap'],
  ],
  msme: [
    ['50-katalog-umkm', '/(msme-tabs)/marketplace'],
    ['51-detail-produk-umkm', '/(msme-tabs)/marketplace/i-001'],
    ['52-keranjang', '/(msme-tabs)/cart'],
    ['53-pesanan', '/(msme-tabs)/orders'],
    ['54-profil-umkm', '/(msme-tabs)/profile'],
  ],
};

const USERS = { auth: F.CITIZEN, citizen: F.CITIZEN, agent: F.AGENT, msme: F.MSME };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const server = serve();
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--disable-web-security', '--disable-features=IsolateOrigins,site-per-process'] });
  const errors = [];
  const done = [];

  for (const [group, list] of Object.entries(SCREENS)) {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      locale: 'id-ID',
      timezoneId: 'Asia/Jakarta',
      permissions: ['geolocation'],
      geolocation: { latitude: -6.3841, longitude: 106.8294 },
      colorScheme: 'light',
    });
    if (group !== 'auth') {
      await ctx.addInitScript(() => {
        try { window.localStorage.setItem('bingo.accessToken', 'qc-token'); } catch (e) {}
      });
    } else {
      await ctx.addInitScript(() => { try { window.localStorage.clear(); } catch (e) {} });
    }

    for (const [name, route] of list) {
      const page = await ctx.newPage();
      const pageErrs = [];
      page.on('pageerror', (e) => pageErrs.push(String(e.message).slice(0, 200)));
      page.on('console', (m) => { if (m.type() === 'error') pageErrs.push(m.text().slice(0, 200)); });
      await installApi(page, USERS[group]);
      try {
        if (name === '52-keranjang') {
          // Keranjang disimpan di memori, jadi harus diisi lalu dibuka lewat
          // navigasi dalam aplikasi — reload halaman akan mengosongkannya lagi.
          await page.goto(`http://127.0.0.1:${PORT}/(msme-tabs)/marketplace/i-001`, { waitUntil: 'load', timeout: 30000 });
          await page.waitForTimeout(2400);
          for (const label of ['Tambah ke keranjang', 'Tambah ke Keranjang']) {
            const b = page.getByText(label, { exact: false }).first();
            if (await b.count()) { await b.click({ timeout: 4000 }).catch(() => {}); break; }
          }
          await page.waitForTimeout(900);
          const tab = page.getByText('Keranjang', { exact: true }).last();
          if (await tab.count()) { await tab.click({ timeout: 4000 }).catch(() => {}); }
          await page.waitForTimeout(2400);
          await page.screenshot({ path: path.join(OUT, `${group}-${name}.png`) });
          const bodyC = (await page.evaluate(() => document.body.innerText || '')).replace(/\s+/g, ' ').slice(0, 90);
          done.push({ name: `${group}-${name}`, route: '(alur: tambah ke keranjang lalu buka tab)', text: bodyC });
          if (pageErrs.length) errors.push({ name, errs: [...new Set(pageErrs)].slice(0, 3) });
          await page.close();
          continue;
        }
        await page.goto(`http://127.0.0.1:${PORT}${route.replace(/#.*$/, '')}`, { waitUntil: 'load', timeout: 30000 });
        await page.waitForTimeout(2600);

        // Layar yang isinya di bawah lipatan, atau yang perlu satu interaksi
        // sebelum bagian barunya terlihat. Tanpa ini harness memotret keadaan
        // kosong dan melaporkannya sebagai lolos.
        /*
         * `#at=<teks>` menggulir sampai kartu yang judulnya cocok berada di
         * layar. Menggulir ke dasar halaman saja tidak cukup: kartu yang ingin
         * diperiksa justru berada di tengah, dan dasar halaman hanya
         * memperlihatkan tombol aksi yang sudah lama ada.
         */
        const at = route.match(/#at=(.+)$/);
        if (at) {
          const target = decodeURIComponent(at[1]);
          const el = page.getByText(target, { exact: false }).first();
          if (await el.count()) {
            await el.scrollIntoViewIfNeeded({ timeout: 6000 }).catch(() => {});
            await page.waitForTimeout(2200);
            await el.scrollIntoViewIfNeeded({ timeout: 6000 }).catch(() => {});
          }
          await page.waitForTimeout(1500);
        }
        if (route.endsWith('#terbitkan')) {
          // Pencocokan PERSIS: judul bagiannya "Terbitkan kartu baru", dan
          // pencocokan longgar akan mengenai judul itu, bukan tombolnya.
          const b = page.getByText('Terbitkan kartu', { exact: true }).first();
          if (await b.count()) await b.click({ timeout: 4000 }).catch(() => {});
          await page.waitForTimeout(1200);
        }
        if (route.endsWith('#tap')) {
          const input = page.locator('input').first();
          if (await input.count()) await input.fill('BG-7K2M-9XQ4').catch(() => {});
          const b = page.getByText('Cari pemegang', { exact: false }).first();
          if (await b.count()) await b.click({ timeout: 4000 }).catch(() => {});
          await page.waitForTimeout(1800);
        }

        const file = path.join(OUT, `${group}-${name}.png`);
        await page.screenshot({ path: file });
        const body = (await page.evaluate(() => document.body.innerText || '')).replace(/\s+/g, ' ').slice(0, 90);
        done.push({ name: `${group}-${name}`, route, text: body });
        if (pageErrs.length) errors.push({ name, errs: [...new Set(pageErrs)].slice(0, 3) });
      } catch (e) {
        errors.push({ name, errs: [String(e.message).slice(0, 160)] });
      }
      await page.close();
    }
    await ctx.close();
  }

  await browser.close();
  server.close();
  console.log(JSON.stringify({ shot: done.length, done, errors }, null, 1));
})();
