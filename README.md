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
pnpm backend:test          # 20 unit test (AuthService, UsersService, RolesGuard, …)
pnpm backend:test:e2e      # 9 e2e: register → login → /me → error path
pnpm mobile:test           # 9 test mobile (authStore + LoginForm)
```

Atau coba manual:

```bash
curl -s http://localhost:3000/api/v1/auth/register \
  -H 'content-type: application/json' \
  -d '{"name":"Budi","phone":"08123456789","password":"rahasiaSekali123","role":"CITIZEN"}'

# Pesan error berbahasa Indonesia, mis. NIK tidak valid:
# {"statusCode":400,"message":"NIK harus 16 digit angka dan memuat tanggal lahir yang valid"}
```

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
- ✅ **Phase 2** — Autentikasi & RBAC (JWT, login/register) (Anda di sini)
- ⏭ Phase 3 — Core API (Reports, Pickup Requests, Marketplace)
- ⏭ Phase 4 — Frontend Warga (TrashScan, Maps, request flow)
- ⏭ Phase 5 — Frontend Pemulung (Dashboard, accept/complete)
- ⏭ Phase 6 — Integrasi AI/ML (TensorFlow Lite + Vision Camera)
