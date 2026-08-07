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
# 1. Sekali saja — dependensi target web
pnpm --filter @bingo/mobile add react-dom@18.2.0 react-native-web@~0.19.10 @expo/metro-runtime@~3.2.3
npm i -g playwright   # atau pnpm add -D playwright di sini

# 2. Bundle web dengan shim modul native diaktifkan
cd apps/mobile
BINGO_WEB_QC=1 EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3999 \
  npx expo export --platform web --output-dir .qc-web --clear

# 3. Ambil tangkapan layar
cd ../../tools/qc-screenshots
node shoot.js          # hasil di ./shots
```

Keluaran: 36 PNG pada 390×844 @2x, satu per layar, dikelompokkan per peran
(`auth-`, `citizen-`, `agent-`, `msme-`). Skrip juga melaporkan setiap galat
konsol dan galat runtime per halaman — daftar kosong berarti tidak ada layar
yang meledak diam-diam.

## Cara kerjanya

- **Tanpa backend.** `shoot.js` menyadap `**/api/v1/**` di lapisan browser dan
  menjawabnya dari `fixtures.js`. Bentuk data mengikuti DTO di
  `packages/shared-types`; bila DTO berubah dan fixture tidak, layar akan
  terlihat kosong — itu sinyal, bukan gangguan.
- **Sesi dipalsukan** dengan menanam token pada `localStorage` sebelum halaman
  dimuat, lalu `/auth/me` menentukan perannya.
- **Dua modul native di-shim** lewat `apps/mobile/tools/qc-web-shims`:
  `expo-secure-store` (tidak ada di browser) dan `expo-camera` (tidak ada kamera
  di lingkungan CI). Alias ini hanya hidup bila `BINGO_WEB_QC` diset.
- Chromium dijalankan dengan `--disable-web-security` semata-mata karena
  fixture dilayani dari origin berbeda; backend sungguhan sudah mengaktifkan
  CORS sendiri.

## Batasnya

Ini pemeriksaan **tata letak dan status**, bukan pengganti uji di perangkat.
Yang tidak tertangkap: perilaku kamera sungguhan, izin OS, gestur, animasi,
performa, dan perbedaan rendering Android/iOS terhadap React Native Web. Layar
yang lolos di sini masih wajib dilihat sekali di perangkat sebelum demo.
