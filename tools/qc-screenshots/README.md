# Perkakas QC — tangkapan layar seluruh layar

Merender **setiap layar aplikasi** ke berkas PNG berukuran ponsel supaya cacat
tampilan dapat ditemukan tanpa memasang aplikasi ke perangkat. Dipakai untuk
menemukan dan memperbaiki cacat yang tidak terlihat oleh `tsc` maupun Jest:
gaya yang tidak diterapkan, teks yang tidak terbaca di atas latar gelap, lencana
yang salah hitung, dan tata letak yang runtuh.

Perkakas ini **tidak** menyentuh build Android/iOS. Ia mem-bundle target web
Expo, yang hanya aktif ketika dijalankan dari sini.

## Cara menjalankan

```bash
# 1. Sekali saja — dependensi target web (versi mengikuti Expo SDK 54)
pnpm --filter @bingo/mobile add -D react-native-web@~0.21.0
npm i -g playwright   # atau pnpm add -D playwright di sini

# 2. Bundle web dengan shim modul native diaktifkan
cd apps/mobile
BINGO_WEB_QC=1 EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3999 \
  npx expo export --platform web --output-dir .qc-web --clear

# 3. Ambil tangkapan layar
cd ../../tools/qc-screenshots
node shoot.js          # hasil di ./shots
./contact-sheet.sh     # lembar kontak per peran di ./sheets
```

Keluaran: 41 PNG pada 390×844 @2x, satu per layar, dikelompokkan per peran
(`auth-`, `citizen-`, `agent-`, `msme-`), ditambah empat lembar kontak
berlabel di `sheets/`. Skrip juga melaporkan setiap galat konsol dan galat
runtime per halaman — daftar kosong berarti tidak ada layar yang meledak
diam-diam.

## Cara kerjanya

- **Tanpa backend.** `shoot.js` menyadap `**/api/v1/**` di lapisan browser dan
  menjawabnya dari `fixtures.js`. Bentuk data mengikuti DTO di
  `packages/shared-types`; bila DTO berubah dan fixture tidak, layar akan
  terlihat kosong — itu sinyal, bukan gangguan.
- **Sesi dipalsukan** dengan menanam token pada `localStorage` sebelum halaman
  dimuat, lalu `/auth/me` menentukan perannya.
- **Tiga modul native di-shim** lewat `apps/mobile/tools/qc-web-shims`:
  `expo-secure-store` (tidak ada di browser), `expo-camera` (tidak ada kamera di
  lingkungan CI), dan `react-native-nfc-manager`. Alias ini hanya hidup bila
  `BINGO_WEB_QC` diset. Shim NFC sengaja melaporkan `isSupported: false`,
  sehingga layar Kartu Mitra merender keadaan "ponsel tidak mendukung NFC" —
  keadaan yang justru paling perlu diperiksa pikselnya, karena di situlah jalur
  nomor kartu manual harus tetap terlihat.
- **Tag skrip diubah jadi `type="module"` saat disajikan.** Expo SDK 54
  memancarkan bundel web yang memakai `import.meta` tetapi menuliskannya sebagai
  skrip klasik; tanpa tambalan ini setiap halaman gagal dengan "Cannot use
  'import.meta' outside a module" dan seluruh tangkapan menjadi putih.
- **Beberapa layar butuh gulir atau satu interaksi.** Rute boleh diakhiri
  `#at=<teks>` (gulir sampai kartu berjudul itu terlihat), `#terbitkan`, atau
  `#tap`. Tanpa itu harness memotret keadaan kosong lalu melaporkannya lolos.
- Chromium dijalankan dengan `--disable-web-security` semata-mata karena
  fixture dilayani dari origin berbeda; backend sungguhan sudah mengaktifkan
  CORS sendiri.

## Batasnya

Ini pemeriksaan **tata letak dan status**, bukan pengganti uji di perangkat.
Yang tidak tertangkap: perilaku kamera sungguhan, izin OS, gestur, animasi,
performa, dan perbedaan rendering Android/iOS terhadap React Native Web. Layar
yang lolos di sini masih wajib dilihat sekali di perangkat sebelum demo.
