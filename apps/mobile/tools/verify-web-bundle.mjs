/**
 * Memverifikasi bundel web hasil `expo export` sebelum ia naik ke produksi.
 *
 * Pemeriksaan sebelumnya adalah `grep` alamat privat ke seluruh bundel, dan itu
 * salah sasaran: axios memuat literal 'http://localhost' sebagai nilai bawaan
 * `origin` miliknya sendiri, sehingga bundel yang benar-benar sehat pun ditolak.
 * Mencari string di dalam kode pihak ketiga tidak pernah bisa menjawab
 * pertanyaan yang sebenarnya diajukan.
 *
 * Pertanyaan yang sebenarnya: alamat mana yang AKAN DIPAKAI aplikasi? Itu satu
 * nilai tunggal — `extra.apiBaseUrl` di dalam manifest yang ditanam Expo — dan
 * nilai itulah yang diperiksa di sini.
 *
 * Pakai: node tools/verify-web-bundle.mjs <dir> <expectedApiBaseUrl>
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const [dir, expected] = process.argv.slice(2);
if (!dir || !expected) {
  console.error('Pakai: node tools/verify-web-bundle.mjs <dist-dir> <expected-api-base-url>');
  process.exit(2);
}

const fail = (msg) => {
  console.error(`::error::${msg}`);
  process.exitCode = 1;
};

const jsDir = join(dir, '_expo/static/js/web');
if (!existsSync(jsDir)) {
  fail(`Tidak ada ${jsDir}. Export web tidak menghasilkan apa pun.`);
  process.exit(1);
}
const bundles = readdirSync(jsDir).filter((f) => f.endsWith('.js'));
if (bundles.length === 0) {
  fail(`Tidak ada berkas .js di ${jsDir}.`);
  process.exit(1);
}

const sources = bundles.map((f) => readFileSync(join(jsDir, f), 'utf8'));

// 1 — Bundel harus bisa dimuat peramban sama sekali.
//
// Expo menulis <script defer> klasik, bukan <script type="module">. Satu
// `import.meta` saja membuat peramban menolak seluruh bundel sebelum React
// sempat dirender, dan setiap halaman jadi putih tanpa pesan apa pun.
sources.forEach((src, i) => {
  const at = src.indexOf('import.meta');
  if (at !== -1) {
    fail(
      `${bundles[i]} memuat import.meta padahal dimuat lewat <script defer> klasik. ` +
        `Peramban menolaknya dan halaman jadi putih. Konteks: ${src.slice(at - 120, at + 80)}`,
    );
  }
});

// 2 — Alamat API yang benar-benar akan dipakai.
//
// Diambil dari manifest yang ditanam Expo, bukan dari sembarang string yang
// kebetulan mirip URL di dalam kode pihak ketiga.
const matches = new Set();
for (const src of sources) {
  const re = /apiBaseUrl\\*"\s*:\s*\\*"((?:https?:)\/\/[^"\\]+)/g;
  let m;
  while ((m = re.exec(src)) !== null) matches.add(m[1]);
}

if (matches.size === 0) {
  fail(
    'Bundel tidak memuat extra.apiBaseUrl sama sekali. ' +
      'app.config.ts tidak terbaca saat build, dan aplikasi tidak akan tahu ke mana harus memanggil.',
  );
} else if (matches.size > 1) {
  fail(`Bundel memuat lebih dari satu apiBaseUrl: ${[...matches].join(', ')}`);
} else {
  const [baked] = matches;
  const norm = (u) => u.replace(/\/+$/, '');
  if (norm(baked) !== norm(expected)) {
    fail(`apiBaseUrl yang tertanam adalah ${baked}, bukan ${expected}.`);
  } else if (!/^https:\/\//.test(baked)) {
    fail(`apiBaseUrl ${baked} bukan https. Web disajikan lewat HTTPS; permintaan HTTP diblokir sebagai mixed content.`);
  } else if (/\/\/(10\.|127\.|localhost|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(baked)) {
    fail(`apiBaseUrl ${baked} adalah alamat privat — tidak dapat dijangkau pengunjung mana pun.`);
  } else {
    console.log(`apiBaseUrl tertanam benar: ${baked}`);
  }
}

if (process.exitCode) {
  console.error('Bundel ditolak.');
} else {
  console.log('Bundel lolos verifikasi.');
}
