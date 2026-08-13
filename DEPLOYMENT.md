# Deployment BinGo ke produksi

Tiga bagian yang berdiri sendiri: **database (Neon)**, **API (Vercel)**, dan
**web (Vercel)**. Kerjakan berurutan — web tidak berguna sebelum API hidup, dan
API tidak bisa boot sebelum database ada.

---

## 0. Kenapa login gagal sebelum ini

Bundel web memuat `EXPO_PUBLIC_API_BASE_URL=http://10.74.181.183:3000`, yaitu
IP LAN laptop pengembang. Dua kegagalan sekaligus:

1. **Mixed content.** Halaman disajikan lewat HTTPS tetapi memanggil HTTP.
   Peramban memblokirnya sebelum permintaan dikirim.
2. **Alamat privat.** `10.x.x.x` tidak dapat dirutekan dari internet.

`EXPO_PUBLIC_*` ditanam saat **build**, bukan dibaca saat runtime — jadi
mengubah variabel saja tidak cukup, bundelnya harus dibangun ulang. Workflow
`frontend-cd.yml` sekarang menolak build bila nilainya bukan `https://` atau
menunjuk alamat privat, lalu memeriksa lagi hasil bundelnya.

---

## 1. Database — Neon

1. Buat project di [neon.tech](https://neon.tech), region **Singapore**.
2. Di SQL Editor, aktifkan PostGIS:

   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

   > **`postgis_topology` tidak tersedia di Neon** dan tidak dipakai skema ini.
   > Migrasi `20260517000000_init` sudah diubah agar melewatinya bila tidak ada.

3. Salin **dua** connection string dari dashboard:

   | Dipakai untuk | Bentuk | Disimpan sebagai |
   |---|---|---|
   | Runtime API | yang ber-**`-pooler`** | `DATABASE_URL` (env Vercel) |
   | Migrasi | yang **tanpa** `-pooler` | `MIGRATE_DATABASE_URL` (secret GitHub) |

   Keduanya berbeda dan tidak bisa saling menggantikan. Runtime serverless
   membuka banyak koneksi pendek sehingga wajib lewat pooler; sementara Prisma
   Migrate memakai advisory lock yang tidak didukung PgBouncer, sehingga lewat
   pooler perintahnya menggantung sampai timeout.

4. Tambahkan `?sslmode=require` bila belum ada.

Isi data awal sekali dari laptop:

```bash
DATABASE_URL='<connection string LANGSUNG>' pnpm --filter @bingo/backend exec prisma migrate deploy
DATABASE_URL='<connection string LANGSUNG>' pnpm --filter @bingo/backend exec ts-node prisma/seed.ts
```

---

## 2. API — Vercel

Buat project Vercel baru, **Root Directory: `apps/backend`**.

### Environment Variables (Production)

| Nama | Nilai | Catatan |
|---|---|---|
| `DATABASE_URL` | connection string **pooled** Neon | |
| `DIRECT_URL` | connection string **langsung** Neon | dipakai Prisma untuk migrasi |
| `JWT_SECRET` | `openssl rand -base64 48` | backend menolak boot bila masih nilai bawaan |
| `JWT_EXPIRES_IN` | `7d` | |
| `NODE_ENV` | `production` | |
| `CORS_ORIGINS` | `https://bingo-web-delta.vercel.app` | dipisah koma bila lebih dari satu |
| `BLOB_READ_WRITE_TOKEN` | dari Vercel Blob | wajib — sistem berkas serverless tidak permanen |

**`CORS_ORIGINS` harus tanpa garis miring di akhir** dan harus persis sama
dengan origin web-nya. Bila dikosongkan, API memantulkan origin mana pun dan
mencetak peringatan di log.

### Kenapa strukturnya begini

`api/index.js` sengaja JavaScript biasa dan setipis mungkin. Berkas di `api/`
dikompilasi runtime Vercel sendiri, yang tidak memancarkan metadata dekorator —
tanpa itu dependency injection NestJS gagal saat runtime dengan pesan yang
menyesatkan. Jadi seluruh kode Nest dikompilasi lebih dulu oleh `tsc` lewat
`buildCommand`, dan `api/index.js` hanya memuat hasilnya dari `dist/`.

`serverless.ts` memanggil `app.init()`, **bukan** `app.listen()`. Runtime Vercel
yang menerima koneksi; `listen()` di sini membuat fungsi menggantung sampai
timeout tanpa pernah menjawab.

---

## 3. Web — Vercel

Project Vercel terpisah, **Root Directory: `apps/mobile`**.

Deploy dilakukan `frontend-cd.yml` dari artefak `expo export`, jadi build
setting di dashboard tidak dipakai.

---

## 4. Secrets & variables GitHub

**Settings → Secrets and variables → Actions**

| Jenis | Nama | Nilai |
|---|---|---|
| Secret | `VERCEL_TOKEN` | Account Settings → Tokens |
| Secret | `VERCEL_ORG_ID` | `.vercel/project.json` setelah `vercel link` |
| Secret | `VERCEL_BACKEND_PROJECT_ID` | project id API |
| Secret | `VERCEL_WEB_PROJECT_ID` | project id web |
| Secret | `MIGRATE_DATABASE_URL` | connection string **langsung** Neon |
| Variable | `EXPO_PUBLIC_API_BASE_URL` | `https://<domain-api>.vercel.app` |

> Sebelumnya keduanya memakai satu `VERCEL_PROJECT_ID`, sehingga backend dan web
> saling menimpa deployment satu sama lain.

---

## 5. Urutan menjalankan pertama kali

```
1. Neon dibuat, CREATE EXTENSION postgis, migrate deploy + seed dari laptop
2. Vercel project API dibuat, env diisi, jalankan Backend CD
3. curl https://<domain-api>/health   -> harus 200
4. Set variable EXPO_PUBLIC_API_BASE_URL ke domain itu
5. Jalankan Frontend CD
6. Buka /login, masuk dengan akun seed
```

Langkah 3 tidak boleh dilewati. Web yang menunjuk API mati akan gagal dengan
cara yang sama persis seperti sebelumnya, dan waktunya habis untuk mencari di
tempat yang salah.

---

## 6. Batas yang harus diketahui

- **Rate limiter jadi per-instance.** `ThrottlerGuard` menyimpan hitungan di
  memori; setiap instance serverless punya hitungannya sendiri, sehingga
  ambangnya efektif mengendur seiring jumlah instance. Cukup untuk demo lomba,
  tidak cukup untuk perlindungan sungguhan.
- **Cold start 1–3 detik** pada permintaan pertama setelah idle. Permintaan
  berikutnya normal.
- **Unggahan wajib lewat Vercel Blob.** Tanpa `BLOB_READ_WRITE_TOKEN`, berkas
  ditulis ke sistem berkas sementara dan hilang begitu instance didaur ulang.
- **Swagger mati di produksi**, sesuai `NODE_ENV=production`.
