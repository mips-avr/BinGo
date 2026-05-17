# BinGo

> Aksi kecil untuk Indonesia yang lebih bersih.

BinGo adalah aplikasi mobile pengelolaan sampah & kemasan ramah lingkungan untuk
ekosistem Indonesia, yang menghubungkan tiga aktor: **Warga**, **Pemulung
(Waste Agent)**, dan **UMKM**.

Repositori ini adalah **monorepo** berisi:

- `apps/backend` — REST API NestJS + Prisma (PostgreSQL/PostGIS).
- `apps/mobile` — aplikasi React Native (Expo) + NativeWind.
- `packages/shared-types` — kontrak DTO bersama backend & mobile.
- `packages/shared-utils` — helper murni (geo, currency, validator NIK/telepon).
- `packages/i18n` — string terlokalisasi Bahasa Indonesia.

---

## Prasyarat

| Tool | Versi minimum | Catatan |
| --- | --- | --- |
| Node.js | 20 LTS | gunakan `nvm use` (lihat `.nvmrc`) |
| pnpm | 9+ | package manager monorepo |
| Docker Desktop | 4.x | menjalankan Postgres + PostGIS lokal |
| Xcode / Android Studio | terbaru | untuk menjalankan Expo di simulator |

## Phase 1 — Setup awal

### 1. Instal dependensi

```bash
pnpm install
```

### 2. Siapkan variabel lingkungan

```bash
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/mobile/.env.example apps/mobile/.env
```

Sesuaikan `JWT_SECRET` minimal 32 karakter (gunakan `openssl rand -hex 32`).

### 3. Jalankan PostgreSQL + PostGIS via Docker

```bash
pnpm db:up
```

Skrip `infra/docker/postgres/init/01-enable-postgis.sql` akan otomatis
mengaktifkan ekstensi `postgis` + `postgis_topology` pada database `bingo`.

### 4. Generate Prisma client & jalankan migrasi

```bash
pnpm backend:prisma:generate
pnpm backend:prisma:migrate
```

Migrasi awal (`20260517000000_init`) membuat:

- Seluruh tabel inti (`users`, `pickup_requests`, `reports`,
  `marketplace_items`, `transactions`) berikut enum & constraint.
- Kolom geospasial `location geometry(Point, 4326)` pada `pickup_requests`
  & `reports`, lengkap dengan **GIST index** untuk query `ST_DWithin`.
- Trigger `bingo_sync_latlng_to_geom()` yang menyinkronkan kolom
  `location` secara otomatis dari pasangan `lat`/`lng` sehingga service
  layer cukup menulis dua kolom skalar tersebut lewat Prisma.

### 5. Jalankan backend (dev)

```bash
pnpm backend:dev
```

Endpoint penting:

| URL | Deskripsi |
| --- | --- |
| `GET http://localhost:3000/health` | Cek kesehatan API + Postgres + PostGIS |
| `GET http://localhost:3000/docs`   | Dokumentasi Swagger (dev only)         |

### 6. Jalankan aplikasi mobile

```bash
pnpm mobile:start
```

Tekan `i` untuk iOS Simulator atau `a` untuk Android Emulator. Saat aplikasi
terbuka, Anda akan melihat layar landing BinGo dalam Bahasa Indonesia
beserta URL API yang sedang dipakai.

---

## Phase 2 — Autentikasi & RBAC

Phase 2 menambahkan autentikasi berbasis **JWT** dengan **Role-Based Access
Control** untuk tiga peran utama (`CITIZEN`, `WASTE_AGENT`, `MSME`).

### Endpoint baru

| Method | URL | Akses | Deskripsi |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/register` | publik | Daftar user baru (nama, telepon, password, role; opsional NIK) |
| `POST` | `/api/v1/auth/login`    | publik | Login via telepon + password, mengembalikan JWT |
| `GET`  | `/api/v1/auth/me`       | bearer | Profil user yang sedang login |
| `GET`  | `/api/v1/users/me`      | bearer | Alias profil user (untuk modul mobile) |

Semua endpoint selain yang dimarkah `@Public()` di-protect secara **global**
melalui `JwtAuthGuard` + `RolesGuard` (terpasang via `APP_GUARD`).

### Arsitektur

- **Backend** — `bcrypt` untuk hash password (cost 10), `@nestjs/jwt` +
  Passport JWT strategy, custom guards (`JwtAuthGuard`, `RolesGuard`) dan
  decorator (`@Public`, `@Roles`, `@CurrentUser`). DTO `RegisterDto`/`LoginDto`
  divalidasi `class-validator` plus validator kustom Indonesia: nomor
  telepon dinormalisasi ke format `+628…`, dan NIK dicek 16 digit + komponen
  tanggal lahir valid via `@bingo/shared-utils`. Seluruh pesan error
  berbahasa Indonesia (lewat `AllExceptionsFilter`).
- **Mobile** — Axios client dengan interceptor JWT (`apps/mobile/src/lib/api/client.ts`),
  `expo-secure-store` untuk persistensi token, dan **Zustand** store
  (`authStore`) yang menjalankan `hydrate()` di `app/_layout.tsx`. Layar
  `/(auth)/login`, `/(auth)/role-select`, dan `/(auth)/register` (Expo Router)
  memakai komponen `Button`/`Input` (NativeWind) plus `LoginForm`/`RegisterForm`
  yang memvalidasi telepon & NIK di sisi klien sebelum hit API.
- **Shared** — `@bingo/shared-types` mengekspor `UserRole`, `AuthResponse`,
  `JwtPayload`, `UserProfile` sehingga kontrak DTO tidak drift.

### Cara verifikasi

```bash
pnpm backend:test          # unit test NestJS (termasuk modul yang lebih baru dari Phase 2)
pnpm backend:test:e2e      # integration test NestJS termasuk auth
pnpm mobile:test           # unit test mobile (auth + Phase 4+)
```

Untuk perkiraan jumlah tes terkini, lihat rangkuman pada **Phase 4**.

Atau coba manual:

```bash
curl -s http://localhost:3000/api/v1/auth/register \
  -H 'content-type: application/json' \
  -d '{"name":"Budi","phone":"08123456789","password":"rahasiaSekali123","role":"CITIZEN"}'

# Pesan error berbahasa Indonesia, mis. NIK tidak valid:
# {"statusCode":400,"message":"NIK harus 16 digit angka dan memuat tanggal lahir yang valid"}
```

---

## Phase 3 — Core API (Pickup, Reports, Marketplace, Points)

Phase 3 melengkapi backend dengan empat modul fungsional yang menjadi
**fondasi** seluruh fitur warga, pemulung, dan UMKM, plus modul **TrashLink
Points** sebagai gamifikasi.

### Endpoint baru

#### Pickup Requests (penjemputan sampah)

| Method | URL | Role | Deskripsi |
| --- | --- | --- | --- |
| `POST`  | `/api/v1/pickup-requests`             | `CITIZEN`     | Buat permintaan baru (lat/lng + material + estimasi berat) |
| `GET`   | `/api/v1/pickup-requests/mine`        | `CITIZEN`     | Daftar permintaan milik sendiri |
| `GET`   | `/api/v1/pickup-requests/nearby`      | `WASTE_AGENT` | Cari permintaan `PENDING` dalam radius (PostGIS `ST_DWithin`) |
| `GET`   | `/api/v1/pickup-requests/assigned`    | `WASTE_AGENT` | Pekerjaan yang sudah diterima |
| `GET`   | `/api/v1/pickup-requests/:id`         | bearer        | Detail (akses dicek berbasis kepemilikan/role) |
| `PATCH` | `/api/v1/pickup-requests/:id/accept`  | `WASTE_AGENT` | Ambil pekerjaan (race-safe; satu agen menang) |
| `PATCH` | `/api/v1/pickup-requests/:id/complete`| `WASTE_AGENT` | Selesaikan → warga otomatis dapat **25 poin** |
| `PATCH` | `/api/v1/pickup-requests/:id/cancel`  | `CITIZEN`     | Batalkan (hanya bila masih `PENDING`) |

#### Reports (laporan pembuangan ilegal)

| Method | URL | Role | Deskripsi |
| --- | --- | --- | --- |
| `POST`  | `/api/v1/reports`              | `CITIZEN`               | Buat laporan dengan foto + GPS |
| `GET`   | `/api/v1/reports`              | bearer                  | Daftar laporan (opsional filter status/radius PostGIS) |
| `GET`   | `/api/v1/reports/mine`         | `CITIZEN`               | Daftar laporan sendiri |
| `GET`   | `/api/v1/reports/:id`          | bearer                  | Detail laporan |
| `PATCH` | `/api/v1/reports/:id/verify`   | `CITIZEN`, `WASTE_AGENT`| Verifikasi (bukan oleh pembuat). 3 vote → status `DIVERIFIKASI` & pelapor dapat **50 poin** |
| `PATCH` | `/api/v1/reports/:id/resolve`  | `CITIZEN`, `WASTE_AGENT`| Tutup laporan setelah ditangani (status `SELESAI`) |

#### Marketplace (WasteMart)

| Method | URL | Role | Deskripsi |
| --- | --- | --- | --- |
| `GET`  | `/api/v1/marketplace/items`            | bearer | Daftar produk (opsional `?search=`) |
| `GET`  | `/api/v1/marketplace/items/:id`        | bearer | Detail produk |
| `POST` | `/api/v1/marketplace/items`            | `MSME` | Tambah produk baru |
| `POST` | `/api/v1/marketplace/checkout`         | `MSME` | Checkout keranjang (atomik: stok berkurang & transaksi tercatat) |
| `GET`  | `/api/v1/marketplace/transactions/mine`| `MSME` | Riwayat transaksi |

### Highlight implementasi

- **Geospasial nyata** — `pickup-requests/nearby` memakai `ST_DWithin` pada
  kolom `location::geography` dengan **GIST index**, mengembalikan
  `distanceMeters` per baris. Trigger `bingo_sync_latlng_to_geom` (Phase 1)
  yang menyinkronkan `lat`/`lng` → `location`, sehingga service layer cukup
  menulis dua kolom skalar tersebut.
- **Race-safe transitions** — `accept` memakai
  `updateMany({ where: { id, status: 'PENDING' } })` agar dua agen yang
  menekan tombol bersamaan tidak saling menimpa. Checkout memakai
  `updateMany({ where: { stock: { gte: qty } } })` di dalam `$transaction`,
  jadi stok mustahil negatif walau ada pembeli paralel.
- **Atomic side-effects** — pemberian poin oleh `PointsService` berjalan
  di dalam transaksi DB yang sama dengan transisi status (`complete` pickup
  dan threshold `verify`), sehingga saldo poin tidak pernah drift.
- **Validasi & pesan Indonesia** — DTO memakai `class-validator` dengan
  pesan Bahasa Indonesia (mis. *"Estimasi berat harus lebih dari 0"*,
  *"Minimal pesanan untuk &lt;produk&gt; adalah 100"*,
  *"Stok '&lt;produk&gt;' tidak cukup (tersisa 100)"*).

### Seed data WasteMart

```bash
pnpm backend:prisma:seed     # idempoten — aman dijalankan ulang
```

Mengisi 4 produk contoh dari UMKM (kantong kraft, sedotan bambu, kotak
makan bagasse, beeswax wrap) agar layar marketplace di mobile sudah punya
katalog sejak hari pertama.

### Verifikasi end-to-end

| Perintah | Cakupan |
| --- | --- |
| `pnpm backend:test`            | 55 unit test (auth, users, points, pickup, reports, items, transactions, guards) |
| `pnpm backend:test:e2e`        | ±28 e2e termasuk auth, PostGIS pickup/report, uploads & statik `/uploads` |
| `bash infra/scripts/verify-phase3.sh` | 21 cek live curl: register multi-role → pickup geospatial → report 3-vote → checkout → stok berkurang → RBAC denial |

Contoh keluaran skrip live:

```
[ OK ] ST_DWithin OK, jarak=2154.4m
[ OK ] pointsBalance=25 (PICKUP_COMPLETED)
[ OK ] Status auto → DIVERIFIKASI
[ OK ] pointsBalance=75 (25 + 50)
[ OK ] Checkout OK — totalAmount=Rp250000
[ OK ] stock=1900 (≤1900)
[ OK ] Ditolak 403 (MSME-only)
```

---

## Phase 4 — Frontend Warga & unggah foto

Phase 4 menambahkan pengalaman **warga (`CITIZEN`)** di aplikasi Expo: navigasi tab,
pemanggilan REST Phase 3 lewat React Query, **GPS** & **kamera/galeri** untuk
laporan, plus endpoint backend untuk **upload gambar** (lalu digunakan sebagai
URL di field `reports.imageUrl`).

### Backend — unggah & penyajian gambar

| Method | URL | Akses | Deskripsi |
| --- | --- | --- | --- |
| `POST` | `/api/v1/uploads/image` | bearer | Unggah foto (`multipart/form-data`, field `file`). MIME: jpeg, png, webp, heic; maks 5 MB |

Respons mencakup `url` publik, misalnya `http://localhost:3000/uploads/<filename>.png`.

- File disimpan di `apps/backend/uploads/` (default); override dengan env **`UPLOADS_DIR`** di production (volume/S3-gateway).
- **Helmet**: `crossOriginResourcePolicy` diset **`cross-origin`** supaya `<Image>` di simulator/device dapat memuat `http://HOST/uploads/…`.
- **`PUBLIC_BASE_URL`** (opsional): basis URL lengkap untuk field `url` bila aplikasi ada di balik proxy/HTTPS.

Lintas file inti:

- Modul **`UploadsModule`** — `apps/backend/src/modules/uploads/`.
- Serving statis **`/uploads/*`** dan konfig `NestExpressApplication` — `apps/backend/src/main.ts`.

### Mobile — apa yang dibuat untuk warga

Setelah login, root `app/index.tsx` mengarahkan ke **`app/(tabs)/`** — tab Expo Router:

| Tab | Konten singkat |
| --- | --- |
| **Beranda** | Salam, badge poin TrashLink, aksi cepat (Pickup / Lapor / WasteMart), ringkasan permintaan & laporan terbaru |
| **Pickup** | Stack: daftar `mine`, formulir baru (lokasi + alamat + material + berat), detail & **batalkan** bila masih `PENDING` |
| **Lapor** | Stack: feed laporan komunitas, formulir baru (foto dari kamera/galeri, upload ke `/uploads`, GPS otomatis), detail & tombol verifikasi (bukan pemilik) |
| **WasteMart** | Stack: katalog dengan pencarian, detail produk, harga `formatIDR`; **browse** untuk warga, catatan bahwa checkout khusus UMKM (Phase selanjutnya) |
| **Profil** | Data akun, poin, **keluar** dengan konfirmasi |

Dependensi utama: **`@tanstack/react-query`**, **`expo-location`**, **`expo-image-picker`**. Provider `QueryClient` dipasang di `app/_layout.tsx`.

Konvensi kode berada di antara lain:

```
apps/mobile/
├── app/(tabs)/              # tab warga + stack pickups / reports / marketplace
├── app/(agent-tabs)/        # tab pemulung: nearby, jobs, reports
├── src/features/{pickups,reports,marketplace,uploads}/
├── src/lib/{api,location,image,query,navigation}/
├── src/components/{ui,pickups,reports,marketplace,profile}/
├── __mocks__/expo-*.ts     # lokasi & image picker untuk Jest
```

Izinkan kamera & lokasi juga dideklarasikan di **`app.config.ts`** (plugin Expo + pesan bahasa Indonesia untuk iOS/Android).

### Shared helpers

`@bingo/shared-utils`: **`formatRelativeId`** untuk teks relativ di feed/list (Bahasa Indonesia, mis. *"5 menit lalu"*).

### Cara verifikasi

Backend (termasuk unggah & statis `/uploads`):

```bash
pnpm backend:test          # ±55 unit
pnpm backend:test:e2e      # ±28 e2e (auth, pickup/report, uploads)
pnpm shared:build          # paket shared-types / shared-utils / i18n
```

Mobile:

```bash
pnpm --filter @bingo/mobile typecheck
pnpm mobile:test           # ±24 test (auth, warga, pemulung, lokasi, upload, …)
```

Shared utils:

```bash
pnpm --filter @bingo/shared-utils test   # ±20 unit (geo, validators, date, …)
```

Contoh cepat dengan backend hidup (`pnpm backend:dev`): daftar/register warga → dapat JWT → kirim foto:

```bash
TOKEN="<paste accessToken>"
curl -s -X POST http://localhost:3000/api/v1/uploads/image \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/photo.jpg"
```

Gunakan URL yang dikembalikan sebagai `imageUrl` saat membuat laporan dari mobile atau dari `curl`.

---

## Phase 5 — Frontend Pemulung (Dashboard, terdekat, pekerjaan)

Phase 5 menambahkan pengalaman **pemulung (`WASTE_AGENT`)** di mobile: tab navigator
terpisah, integrasi penuh dengan API Phase 3 (`/nearby`, `/assigned`, `accept`,
`complete`, `resolve` laporan).

### Routing per peran

Setelah login, `app/index.tsx` memanggil `getAuthenticatedHome(role)`:

| Peran | Rute home |
| --- | --- |
| `CITIZEN` | `/(tabs)` — tab warga (Phase 4) |
| `WASTE_AGENT` | `/(agent-tabs)` — tab pemulung |
| `MSME` | `/(msme-tabs)` — belanja, keranjang, checkout (Phase 6) |

Layout `(tabs)` menolak akses pemulung (redirect ke `/(agent-tabs)`), dan sebaliknya.

### Tab pemulung (`app/(agent-tabs)/`)

| Tab | Fitur |
| --- | --- |
| **Dashboard** | Ringkasan: jumlah permintaan terdekat, pekerjaan aktif, laporan `DIVERIFIKASI` yang perlu ditangani |
| **Terdekat** | GPS + pilih radius (3/5/10/15 km) → `GET /pickup-requests/nearby` → kartu dengan **jarak** (`formatDistanceMeters`) & tombol **Terima** |
| **Pekerjaan** | Daftar `GET /pickup-requests/assigned` → detail → **Selesaikan** (`PATCH …/complete`, warga +25 poin) |
| **Laporan** | Feed laporan berstatus `DIVERIFIKASI` → detail → **Tandai selesai ditangani** (`PATCH …/resolve`) |
| **Profil** | `ProfileView` bersama (tanpa badge poin; poin hanya untuk warga) |

### Hooks & utilitas baru

- **`useNearbyPickups`**, **`useAssignedPickups`**, **`useAcceptPickup`**, **`useCompletePickup`** — `src/features/pickups/hooks.ts`
- **`useResolveReport`** — `src/features/reports/hooks.ts`
- **`useAgentLocation`** — lokasi foreground untuk query terdekat
- **`getAuthenticatedHome`** — `src/lib/navigation/role-routes.ts`
- **`formatDistanceMeters`** — `src/lib/geo/format.ts`

Polling ringan: query terdekat di-refresh otomatis setiap **30 detik** bila tab aktif.

### Alur uji manual (pemulung)

1. Daftar/masuk sebagai **`WASTE_AGENT`** (atau akun pemulung dari skrip Phase 3).
2. Pastikan ada permintaan `PENDING` dari akun warga (`pnpm backend:dev` + buat pickup dari app warga atau `verify-phase3.sh`).
3. Tab **Terdekat** → izinkan lokasi → pilih radius → **Terima** permintaan.
4. Tab **Pekerjaan** → buka detail → **Selesaikan** → cek saldo poin warga naik (+25) via `GET /auth/me`.
5. Tab **Laporan** → buka laporan diverifikasi → **Tandai selesai**.

### Verifikasi

```bash
pnpm shared:build
pnpm --filter @bingo/mobile typecheck
pnpm mobile:test           # ±24 test (termasuk routing peran, jarak, NearbyPickupCard)
pnpm backend:test:e2e      # alur pickup geospasial & resolve sudah dicakup Phase 3
```

---

## Phase 6 — TrashScan & checkout UMKM

Phase 6 menambahkan **pemindai kemasan (TrashScan)** untuk warga dan alur
**belanja WasteMart** penuh untuk akun **UMKM (`MSME`)**.

### TrashScan (warga — tab `/(tabs)/scanner`)

| Komponen | Lokasi |
| --- | --- |
| Kamera & UI | `app/(tabs)/scanner/` — tangkap foto atau pilih kode daur ulang 1–7 |
| Hasil & edukasi | `scanner/result` — material, tips pembuangan (ID), hint poin edukasi |
| Pipeline klasifikasi | `src/features/scanner/` — `classifyPackaging()` → coba TFLite, fallback heuristik warna |
| Prefill pickup | Tombol **Buat permintaan pickup** → `pickups/new?materialType=…` |

**Mode model**

- **Expo Go / tanpa dev client:** heuristik thumbnail (`expo-image-manipulator`) + pemetaan manual kode 1–7.
- **Dev build (opsional):** pasang `react-native-fast-tflite` + bundel `.tflite` — `tfliteBridge.ts` akan memilih engine `tflite` bila modul native tersedia.

Dependensi: `expo-camera`, `expo-image-manipulator` (plugin kamera di `app.config.ts`).

### Checkout UMKM (`/(msme-tabs)`)

| Tab | Fitur |
| --- | --- |
| **Belanja** | Katalog WasteMart + detail produk |
| **Keranjang** | Zustand `cartStore` — qty, total, `POST /api/v1/marketplace/checkout` |
| **Pesanan** | `GET /api/v1/marketplace/transactions/mine` |
| **Profil** | `ProfileView` (tanpa badge poin) |

Routing: `getAuthenticatedHome('MSME')` → `/(msme-tabs)`; layout `(tabs)` mengalihkan MSME & pemulung ke home masing-masing.

### Verifikasi

```bash
pnpm shared:build
pnpm --filter @bingo/mobile typecheck
pnpm mobile:test           # termasuk classifier TrashScan, cartStore, routing MSME
pnpm backend:test:e2e      # checkout & RBAC MSME sudah di Phase 3
```

Alur uji manual:

1. **Warga** — tab TrashScan → pindai / pilih kode → buat pickup dengan material terisi.
2. **UMKM** — login MSME → belanja → keranjang → bayar → cek tab Pesanan & stok produk berkurang di API.

---

## Skrip umum

| Perintah | Deskripsi |
| --- | --- |
| `pnpm db:up` / `pnpm db:down` | Naik/turunkan Postgres + PostGIS |
| `pnpm db:reset` | Hapus volume + restart (data dev hilang) |
| `pnpm backend:test` | Unit test backend (Jest) |
| `pnpm backend:test:e2e` | Integration test backend |
| `pnpm mobile:test` | Unit test mobile (jest-expo) |
| `pnpm -r --parallel test` | Jalankan seluruh test workspace |
| `pnpm format` | Format kode dengan Prettier |

---

## Struktur direktori (ringkas)

```
BinGo/
├── apps/
│   ├── backend/      # NestJS + Prisma
│   └── mobile/       # Expo (React Native)
├── packages/
│   ├── shared-types/ # DTO bersama
│   ├── shared-utils/ # validator NIK / telepon / geo
│   └── i18n/         # Bahasa Indonesia (default)
├── infra/
│   ├── docker/       # init SQL PostGIS
│   └── scripts/      # helper bash
├── docker-compose.yml
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

---

## Catatan teknis PostGIS

- Versi PostgreSQL: **16** dengan PostGIS **3.4** (image `postgis/postgis:16-3.4`).
- Prisma menyatakan kolom geospasial dengan
  `Unsupported("geometry(Point, 4326)")`. Pembacaan kustom (mis. radius pencarian)
  dilakukan via `prisma.$queryRaw` menggunakan `ST_DWithin(location, ST_MakePoint(lng, lat)::geography, radius_m)`.
- Penulisan koordinat cukup melalui Prisma standar (`lat`, `lng`); trigger
  Postgres akan menyinkronkan kolom `location` secara otomatis.

## Roadmap fase

- ✅ **Phase 1** — Inisialisasi proyek & database
- ✅ **Phase 2** — Autentikasi & RBAC (JWT, login/register)
- ✅ **Phase 3** — Core API (Pickup, Reports, Marketplace, Points)
- ✅ **Phase 4** — Frontend Warga (tab Beranda/Pickup/Lapor/WasteMart/Profil, GPS, foto, uploads)
- ✅ **Phase 5** — Frontend Pemulung (dashboard, terdekat, terima/selesai, resolve laporan)
- ✅ **Phase 6** — TrashScan (kamera + heuristik/TFLite-ready) & checkout UMKM (keranjang + pesanan)
