# BinGo — Checklist Pengujian End-to-End (Phase 1–6)

Dokumen ini untuk **QA manual** dan **smoke test** sebelum demo / merge.  
Lingkup: infrastruktur, API backend, aplikasi mobile (Expo) untuk tiga peran: **Warga**, **Pemulung**, **UMKM**.

**Isi dokumen**

1. [Tutorial setup (wajib baca)](#tutorial-setup-cepat)
2. [Informasi uji](#informasi-uji)
3. [Persiapan lingkungan](#0-persiapan-lingkungan)
4. Checklist per phase + [golden path](#golden-path--satu-alur-lengkap-disarankan)
5. [Troubleshooting](#troubleshooting)
6. [Temuan & sign-off](#temuan--bug)

---

## Tutorial setup cepat

Ikuti urutan ini di **root monorepo** (`BinGo/`). Terminal butuh **2 jendela**: satu untuk backend, satu untuk mobile.

### A. Setup pertama kali (fresh machine)

```bash
# 1. Dependensi
pnpm install

# 2. Environment (salin lalu edit JWT_SECRET ≥ 32 karakter)
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/mobile/.env.example apps/mobile/.env

# 3. Database PostGIS
pnpm db:up
# Tunggu ±10 detik agar Postgres siap

# 4. Prisma
pnpm backend:prisma:generate
pnpm --filter @bingo/backend prisma:migrate:deploy   # ← apply migrasi (bukan buat migrasi baru)
pnpm backend:prisma:seed

# 5. Shared packages (wajib sebelum mobile)
pnpm shared:build

# 6. Jalankan (2 terminal terpisah)
pnpm backend:dev          # terminal 1 → http://localhost:3000
pnpm mobile:start         # terminal 2 → tekan i (iOS) atau a (Android)
```

**Verifikasi cepat**

```bash
curl -s http://localhost:3000/health | head
# Harus ada indikasi API/DB sehat
```

### B. Sudah pernah setup — hanya mau uji lagi

```bash
pnpm db:up
pnpm --filter @bingo/backend prisma:migrate:deploy
pnpm shared:build
pnpm backend:dev
# terminal lain:
pnpm mobile:start
```

Tidak perlu `prisma migrate dev` kecuali Anda mengubah `schema.prisma` sebagai developer.

### C. Database kotor / migrasi gagal — reset penuh

```bash
pnpm db:reset
# Tunggu container postgres hidup (~10 detik)
pnpm backend:prisma:generate
pnpm --filter @bingo/backend prisma:migrate:deploy
pnpm backend:prisma:seed
```

`db:reset` **menghapus semua data** di volume Docker (akun uji, pickup, dll.).

### D. URL API di mobile (penting)

| Lingkungan | `EXPO_PUBLIC_API_BASE_URL` di `apps/mobile/.env` |
| --- | --- |
| iOS Simulator | `http://localhost:3000` |
| Android Emulator | `http://10.0.2.2:3000` |
| Device fisik (Wi‑Fi sama) | `http://<IP-Laptop>:3000` |

Setelah mengubah `.env`, **restart** Expo (`r` di Metro atau stop → `pnpm mobile:start`).

### E. Prisma: `migrate dev` vs `migrate deploy`

| Perintah | Kapan dipakai |
| --- | --- |
| `pnpm --filter @bingo/backend prisma:migrate:deploy` | **Tester / QA** — menerapkan migrasi yang sudah ada di repo |
| `pnpm backend:prisma:migrate` (`migrate dev`) | **Developer** — membuat migrasi baru setelah edit `schema.prisma` |

**Jika muncul prompt** `Enter a name for the new migration`:

- Anda **bukan** developer yang mengubah schema → tekan **Ctrl+C**, lalu jalankan `prisma:migrate:deploy`.
- Anda **memang** mengubah model → beri nama deskriptif (`add_foo_column`), **bukan** nama generik seperti `e2e_testing_phase_6`.

**Jangan** menambahkan `postgis(version: "…")` di `schema.prisma` — PostGIS sudah di migrasi `20260517000000_init`. Migrasi yang mencoba `DROP EXTENSION postgis` akan gagal (error P3006).

---

## Informasi uji

| Item | Isi |
| --- | --- |
| **Tester** | _nama_ |
| **Tanggal** | _dd/mm/yyyy_ |
| **Branch / commit** | _hash atau branch_ |
| **Platform mobile** | ☐ iOS Simulator ☐ Android Emulator ☐ Device fisik |
| **Backend URL** | `http://localhost:3000` (default) |
| **Mobile env** | `EXPO_PUBLIC_API_BASE_URL` di `apps/mobile/.env` |

**Legenda kolom hasil**

| Simbol | Arti |
| --- | --- |
| ☐ | Belum diuji |
| ✅ | Lulus |
| ❌ | Gagal (isi catatan di bagian **Temuan**) |
| ⏭ | Dilewati (jelaskan alasan) |

---

## 0. Persiapan lingkungan

Centang setelah [tutorial setup](#tutorial-setup-cepat) berhasil. Detail perintah ada di tutorial; tabel ini untuk **sign-off QA**.

| # | Langkah | Perintah / aksi | ✅/❌ | Catatan |
| --- | --- | --- | --- | --- |
| 0.1 | Clone & install | `pnpm install` | ☐ | Node ≥ 20, pnpm ≥ 9 |
| 0.2 | Env files | Salin `.env.example` → `.env`, `apps/backend/.env`, `apps/mobile/.env` | ☐ | `JWT_SECRET` ≥ 32 karakter; cek [URL API mobile](#d-url-api-di-mobile-penting) |
| 0.3 | Database | `pnpm db:up` | ☐ | Docker Desktop harus jalan |
| 0.4 | Prisma generate | `pnpm backend:prisma:generate` | ☐ | |
| 0.5 | Prisma migrate | `pnpm --filter @bingo/backend prisma:migrate:deploy` | ☐ | Bukan `migrate dev` untuk QA |
| 0.6 | Status migrasi | `cd apps/backend && npx prisma migrate status` | ☐ | Harus: *Database schema is up to date* |
| 0.7 | Seed | `pnpm backend:prisma:seed` | ☐ | 4 produk WasteMart |
| 0.8 | Build shared | `pnpm shared:build` | ☐ | Wajib sebelum mobile |
| 0.9 | Backend dev | `pnpm backend:dev` | ☐ | Port 3000, biarkan terminal terbuka |
| 0.10 | Mobile | `pnpm mobile:start` → `i` / `a` | ☐ | Izin lokasi & kamera saat diminta |
| 0.11 | Health API | `curl http://localhost:3000/health` | ☐ | Status OK, DB terhubung |
| 0.12 | Swagger (opsional) | `http://localhost:3000/docs` | ☐ | |

### Regresi otomatis (opsional, sebelum manual)

```bash
pnpm backend:test
pnpm backend:test:e2e
pnpm mobile:test
pnpm --filter @bingo/mobile typecheck
# Butuh backend hidup:
bash infra/scripts/verify-phase3.sh
```

| # | Perintah | ✅/❌ | Catatan |
| --- | --- | --- | --- |
| A.1 | `pnpm backend:test` | ☐ | |
| A.2 | `pnpm backend:test:e2e` | ☐ | |
| A.3 | `pnpm mobile:test` | ☐ | |
| A.4 | `verify-phase3.sh` | ☐ | 21 cek curl Phase 3 |

---

## 1. Akun uji

Buat akun **baru** per sesi uji (hindari bentrok data). Gunakan password yang sama untuk kemudahan, mis. `rahasiaSekali123`.

| Peran | Nama contoh | Telepon | Dipakai di phase |
| --- | --- | --- | --- |
| Warga A (pelapor utama) | Budi Warga | `0812xxxx001` | 4, 6 |
| Warga B | Siti Verifier | `0812xxxx002` | 4 (verifikasi laporan) |
| Warga C | Andi Verifier | `0812xxxx003` | 4 |
| Warga D | Rina Verifier | `0812xxxx004` | 4 |
| Pemulung | Joko Agent | `0812xxxx005` | 5 |
| UMKM | Toko Hijau | `0812xxxx006` | 6 |

> **Tips:** Di simulator, izinkan **Lokasi** dan **Kamera** saat diminta.

---

## Phase 1 — Infrastruktur & fondasi

| # | Skenario | Langkah singkat | Hasil yang diharapkan | ✅/❌ | Catatan |
| --- | --- | --- | --- | --- | --- |
| 1.1 | Health check | `GET /health` | `ok`, Postgres + PostGIS | ☐ | |
| 1.2 | Mobile landing | Buka app tanpa login | Layar landing ID, URL API benar | ☐ | |
| 1.3 | Migrasi DB | `npx prisma migrate status` di `apps/backend` | *Up to date*, 1 migrasi (`init`) | ☐ | Lihat [Troubleshooting](#troubleshooting) jika gagal |
| 1.4 | PostGIS | Health / pickup nearby (Phase 3+) | Query geospasial tidak error | ☐ | Ekstensi aktif via migrasi init + Docker init SQL |

---

## Phase 2 — Autentikasi & RBAC

### 2A. Mobile

| # | Skenario | Langkah | Hasil yang diharapkan | ✅/❌ | Catatan |
| --- | --- | --- | --- | --- | --- |
| 2.1 | Register Warga A | Role-select → daftar `CITIZEN` | Masuk ke tab warga `/(tabs)` | ☐ | |
| 2.2 | Register Pemulung | Daftar `WASTE_AGENT` | Masuk ke `/(agent-tabs)` | ☐ | |
| 2.3 | Register UMKM | Daftar `MSME` | Masuk ke `/(msme-tabs)` | ☐ | |
| 2.4 | Login ulang | Tutup app → buka lagi | Masih login (token SecureStore) | ☐ | |
| 2.5 | Logout Warga A | Profil → Keluar → konfirmasi | Kembali ke login | ☐ | |
| 2.6 | Login lagi Warga A | Telepon + password | Masuk `/(tabs)` | ☐ | |
| 2.7 | Validasi form | NIK/telepon tidak valid saat daftar | Pesan error Bahasa Indonesia | ☐ | |

### 2B. RBAC & routing

| # | Skenario | Langkah | Hasil yang diharapkan | ✅/❌ | Catatan |
| --- | --- | --- | --- | --- | --- |
| 2.8 | Pemulung tidak di tab warga | Login pemulung, coba akses flow warga | Redirect ke `/(agent-tabs)` | ☐ | |
| 2.9 | UMKM tidak di tab warga | Login UMKM | Redirect ke `/(msme-tabs)` | ☐ | |
| 2.10 | Warga tidak di tab pemulung | Login warga | Tetap di `/(tabs)` | ☐ | |

### 2C. API (opsional, curl/Postman)

| # | Skenario | Hasil yang diharapkan | ✅/❌ | Catatan |
| --- | --- | --- | --- | --- |
| 2.11 | `GET /api/v1/auth/me` tanpa token | 401 | ☐ | |
| 2.12 | Warga `POST /marketplace/checkout` | 403 | ☐ | |

---

## Phase 3 — Core API (backend)

> Bisa diotomatisasi: `bash infra/scripts/verify-phase3.sh` (backend harus hidup).

### Pickup & poin

| # | Skenario | Akun | Hasil yang diharapkan | ✅/❌ | Catatan |
| --- | --- | --- | --- | --- | --- |
| 3.1 | Buat pickup | Warga A | Status `PENDING` | ☐ | Via mobile Phase 4/6 |
| 3.2 | Nearby | Pemulung | Pickup muncul + `distanceMeters` | ☐ | GPS/simulator dekat koordinat pickup |
| 3.3 | Accept | Pemulung | Status `ACCEPTED` / assigned | ☐ | |
| 3.4 | Accept race | 2 pemulung (jika ada) | Hanya satu sukses | ☐ | Opsional |
| 3.5 | Complete | Pemulung | `COMPLETED`, Warga A **+25 poin** | ☐ | Cek profil / `auth/me` |
| 3.6 | Cancel | Warga (pickup baru `PENDING`) | `CANCELLED` | ☐ | |

### Laporan & poin

| # | Skenario | Akun | Hasil yang diharapkan | ✅/❌ | Catatan |
| --- | --- | --- | --- | --- | --- |
| 3.7 | Buat laporan | Warga A | `DILAPORKAN` | ☐ | |
| 3.8 | Verify ×3 | Warga B, C, D | Setelah ke-3 → `DIVERIFIKASI`, Warga A **+50 poin** | ☐ | Pembuat tidak boleh verify sendiri |
| 3.9 | Resolve | Pemulung | `SELESAI` | ☐ | |

### Marketplace

| # | Skenario | Akun | Hasil yang diharapkan | ✅/❌ | Catatan |
| --- | --- | --- | --- | --- | --- |
| 3.10 | List produk | Semua role login | Katalog tampil | ☐ | |
| 3.11 | Checkout | UMKM | Sukses, stok berkurang | ☐ | Lihat Phase 6 mobile |
| 3.12 | Checkout ditolak | Warga A | 403 | ☐ | |

---

## Phase 4 — Frontend Warga

**Login sebagai Warga A** (kecuali verifikasi memakai B/C/D).

| # | Skenario | Tab / layar | Langkah | Hasil yang diharapkan | ✅/❌ | Catatan |
| --- | --- | --- | --- | --- | --- | --- |
| 4.1 | Beranda | Beranda | Buka app | Salam, badge poin, aksi cepat (Pickup / **TrashScan** / Lapor / WasteMart) | ☐ | |
| 4.2 | Buat pickup | Pickup → Baru | Isi lokasi, alamat, material, berat | Sukses, muncul di daftar `mine` | ☐ | |
| 4.3 | Detail pickup | Pickup → Detail | Buka item | Data sesuai input | ☐ | |
| 4.4 | Batalkan pickup | Pickup → Detail | Cancel (hanya `PENDING`) | Status dibatalkan | ☐ | |
| 4.5 | Upload & laporan | Lapor → Baru | Foto (kamera/galeri) + GPS | Laporan terkirim | ☐ | |
| 4.6 | Gambar laporan | Lapor → Detail | Buka laporan | Foto dari `/uploads/...` tampil | ☐ | |
| 4.7 | Verifikasi | Lapor → Detail | Login B/C/D, tombol verifikasi | Counter naik | ☐ | |
| 4.8 | Diverifikasi otomatis | — | Setelah 3 verify | Status diverifikasi, poin pelapor +50 | ☐ | |
| 4.9 | WasteMart browse | WasteMart | Cari produk, buka detail | Harga IDR, **notice checkout khusus UMKM** | ☐ | |
| 4.10 | Profil | Profil | Lihat data + poin | Sesuai `auth/me` | ☐ | |
| 4.11 | Logout | Profil | Keluar | Kembali ke login | ☐ | |

---

## Phase 5 — Frontend Pemulung

**Login sebagai Pemulung.** Pastikan ada pickup `PENDING` dari Warga A dan laporan `DIVERIFIKASI`.

| # | Skenario | Tab | Langkah | Hasil yang diharapkan | ✅/❌ | Catatan |
| --- | --- | --- | --- | --- | --- | --- |
| 5.1 | Dashboard | Dashboard | Buka tab | Angka ringkasan masuk akal | ☐ | |
| 5.2 | Terdekat + GPS | Terdekat | Izin lokasi, pilih radius | Daftar pickup + jarak (m/km) | ☐ | |
| 5.3 | Terima pickup | Terdekat | Tap Terima | Sukses, pindah ke Pekerjaan | ☐ | |
| 5.4 | Daftar pekerjaan | Pekerjaan | Buka daftar | Pickup yang diterima ada | ☐ | |
| 5.5 | Selesaikan | Pekerjaan → Detail | Complete | Sukses; Warga A +25 poin | ☐ | Verifikasi di akun warga |
| 5.6 | Laporan diverifikasi | Laporan | Buka feed | Hanya/mulai dari `DIVERIFIKASI` | ☐ | |
| 5.7 | Resolve laporan | Laporan → Detail | Tandai selesai | Status selesai | ☐ | |
| 5.8 | Profil pemulung | Profil | Buka | **Tanpa** badge poin TrashLink | ☐ | |

---

## Phase 6 — TrashScan & checkout UMKM

### 6A. TrashScan (Warga A)

| # | Skenario | Langkah | Hasil yang diharapkan | ✅/❌ | Catatan |
| --- | --- | --- | --- | --- | --- |
| 6.1 | Buka TrashScan | Tab TrashScan atau Beranda → Pindai | Layar kamera / izin | ☐ | |
| 6.2 | Izin kamera ditolak | Tolak izin → minta lagi | Pesan + tombol retry | ☐ | Opsional |
| 6.3 | Pindai / kode manual | Foto atau tap angka 1–7 | Layar hasil: material, tips, confidence | ☐ | |
| 6.4 | Prefill pickup | Hasil → Buat permintaan pickup | Form: **material sudah terisi** | ☐ | |
| 6.5 | Submit pickup | Lengkapi lokasi & kirim | Pickup `PENDING` (lanjut ke 5.2) | ☐ | |

### 6B. Checkout UMKM

**Login sebagai UMKM.**

| # | Skenario | Tab | Langkah | Hasil yang diharapkan | ✅/❌ | Catatan |
| --- | --- | --- | --- | --- | --- | --- |
| 6.6 | Katalog | Belanja | Browse + search | Produk seed tampil | ☐ | |
| 6.7 | Tambah keranjang | Detail produk | Set qty ≥ min order → tambah | Badge keranjang naik | ☐ | |
| 6.8 | Keranjang | Keranjang | +/- qty, hapus item | Total IDR benar | ☐ | |
| 6.9 | Checkout | Keranjang | Bayar sekarang | Sukses, keranjang kosong | ☐ | |
| 6.10 | Pesanan | Pesanan | Buka riwayat | Transaksi baru muncul | ☐ | |
| 6.11 | Stok berkurang | Detail produk / API | Bandingkan stok sebelum/sesudah | Stok turun sesuai qty | ☐ | |
| 6.12 | Warga tidak checkout | Login Warga A → WasteMart | — | Hanya browse + notice UMKM | ☐ | |

---

## Golden path — satu alur lengkap (disarankan)

Centang setelah **seluruh rantai** berhasil dalam satu sesi:

| Step | Peran | Aksi | ✅/❌ |
| --- | --- | --- | --- |
| G1 | — | Persiapan 0.1–0.12 | ☐ |
| G2 | Warga A | Register + login | ☐ |
| G3 | Warga A | TrashScan → buat pickup | ☐ |
| G4 | Pemulung | Terdekat → terima → selesaikan | ☐ |
| G5 | Warga A | Cek poin +25 | ☐ |
| G6 | Warga A | Buat laporan (foto + GPS) | ☐ |
| G7 | Warga B,C,D | Verifikasi 3× → diverifikasi, +50 poin | ☐ |
| G8 | Pemulung | Resolve laporan | ☐ |
| G9 | UMKM | Belanja → keranjang → checkout → pesanan | ☐ |
| G10 | Warga A | Coba checkout (harus gagal / tidak ada UI) | ☐ |
| G11 | Semua | Logout / login ulang tiap role | ☐ |

---

## Matriks RBAC (referensi cepat)

| Aksi | Warga | Pemulung | UMKM |
| --- | :---: | :---: | :---: |
| Buat pickup | ✅ | ❌ | ❌ |
| Nearby / terima / selesaikan pickup | ❌ | ✅ | ❌ |
| Buat laporan | ✅ | ❌ | ❌ |
| Verifikasi laporan | ✅ | ✅ | ❌ |
| Resolve laporan | ❌ | ✅ | ❌ |
| TrashScan | ✅ | ❌ | ❌ |
| Browse WasteMart | ✅ | ✅ | ✅ |
| Checkout / pesanan | ❌ | ❌ | ✅ |

---

## Troubleshooting

### Prisma P3006 — `cannot drop extension postgis`

**Gejala:** `pnpm backend:prisma:migrate` gagal di shadow database; ada migrasi yang `DROP EXTENSION postgis`.

**Penyebab:** Migrasi salah (biasanya dari pin versi PostGIS di `schema.prisma`).

**Solusi (QA / fresh dev):**

```bash
# Jangan pakai migrate dev; apply migrasi yang valid saja:
pnpm --filter @bingo/backend prisma:migrate:deploy

# Jika masih error / migrasi failed di DB:
pnpm db:reset
sleep 10
pnpm backend:prisma:generate
pnpm --filter @bingo/backend prisma:migrate:deploy
pnpm backend:prisma:seed
```

Jika ada entri migrasi gagal di `_prisma_migrations`, developer bisa:

```bash
cd apps/backend
npx prisma migrate resolve --rolled-back "<nama_migrasi_gagal>"
```

### Prompt `Enter a name for the new migration`

- **Tester:** Ctrl+C → gunakan `prisma:migrate:deploy` (lihat [bagian E](#e-prisma-migrate-dev-vs-migrate-deploy)).
- **Developer:** isi nama yang menjelaskan perubahan model; jangan buat migrasi hanya untuk PostGIS.

### Expo: `TerminalReporter` / `ERR_PACKAGE_PATH_NOT_EXPORTED` (Metro)

**Gejala:** `expo start` gagal dengan pesan `Package subpath './src/lib/TerminalReporter' is not defined` di `metro/package.json`.

**Penyebab umum:**

1. **Node.js terlalu baru** (mis. v25) — Expo SDK 51 + RN 0.74 ditest di **Node 20 LTS**.
2. Dependensi yang menarik **Metro 0.84+** ke monorepo (sudah diperbaiki: jangan pasang `react-native-worklets` terpisah).

**Solusi:**

```bash
nvm use          # pakai Node 20 dari .nvmrc
pnpm install     # setelah pull perubahan lockfile
pnpm mobile:start
```

Jika masih gagal:

```bash
rm -rf node_modules apps/mobile/node_modules
pnpm install
pnpm mobile:start
```

### `EADDRINUSE: address already in use :::3000`

Port 3000 masih dipakai instance backend lama (sering terjadi setelah `Ctrl+C` tidak membersihkan proses, atau menjalankan `pnpm backend:dev` dua kali).

```bash
# macOS — hentikan proses di port 3000
lsof -ti :3000 | xargs kill -9

# lalu jalankan lagi (hanya satu terminal backend)
pnpm backend:dev
```

Cek cepat: `curl http://localhost:3000/health` harus merespons.

### Mobile tidak bisa login / network error

1. Backend harus jalan (`pnpm backend:dev`).
2. Cek `EXPO_PUBLIC_API_BASE_URL` ([tabel URL](#d-url-api-di-mobile-penting)).
3. Restart Metro setelah ubah `.env`.
4. Android: pastikan pakai `10.0.2.2`, bukan `localhost`.

### Pickup terdekat kosong (pemulung)

1. Harus ada pickup `PENDING` dari akun warga.
2. Izinkan **lokasi** di simulator (Features → Location → custom coordinate dekat pickup, mis. Jakarta).
3. Perbesar radius (3 → 15 km) di tab Terdekat.

### Gambar laporan tidak tampil

1. Upload harus sukses (backend log tidak 4xx).
2. URL gambar harus bisa diakses dari device (`http://HOST:3000/uploads/...`).
3. Di device fisik, `HOST` = IP laptop, bukan `localhost`.

### Seed / WasteMart kosong

```bash
pnpm backend:prisma:seed
```

Lalu refresh tab Belanja / WasteMart di app.

### Regresi otomatis gagal

```bash
pnpm shared:build
pnpm backend:test
pnpm backend:test:e2e
pnpm mobile:test
```

Backend e2e dan `verify-phase3.sh` membutuhkan Postgres hidup (`pnpm db:up`).

---

## Temuan & bug

Salin baris per temuan:

| ID | Phase | # checklist | Severity | Deskripsi | Langkah reproduksi | Screenshot/log |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | | | ☐ Blocker ☐ Major ☐ Minor | | | |
| 2 | | | | | | |

**Severity**

- **Blocker** — tidak bisa lanjut uji / crash / data rusak  
- **Major** — fitur utama gagal, ada workaround  
- **Minor** — UI/copy/edge case kecil  

---

## Ringkasan sign-off

| Metrik | Nilai |
| --- | --- |
| Total item manual (perkiraan) | ~55+ |
| Lulus (✅) | |
| Gagal (❌) | |
| Dilewati (⏭) | |
| Golden path G1–G11 | ☐ Lulus ☐ Gagal |

**Keputusan**

- ☐ **Siap demo / merge** — tidak ada blocker, golden path lulus  
- ☐ **Perlu perbaikan** — ada blocker/major (lampirkan tabel Temuan)  

**Tester:** _______________________  **Tanggal:** _______________________

---

**Referensi**

- `README.md` — deskripsi fitur per phase  
- `infra/scripts/verify-phase3.sh` — smoke test API otomatis (21 cek)  
- `apps/backend/prisma/migrations/20260517000000_init/` — skema DB + PostGIS  

_Diperbarui untuk Phase 6 (TrashScan, MSME checkout) dan alur migrasi Prisma yang aman untuk QA._
