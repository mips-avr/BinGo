# Deployment BinGo ke produksi

Tiga bagian: **database (Neon)**, **API (Render)**, **web (Vercel)**. Kerjakan
berurutan — web tidak berguna sebelum API hidup, dan API tidak bisa boot sebelum
database ada.

---

## 0. Kenapa login gagal sebelum ini

Bundel web memuat `EXPO_PUBLIC_API_BASE_URL=http://10.74.181.183:3000`, yaitu IP
LAN laptop pengembang. Dua kegagalan sekaligus: halaman HTTPS memanggil HTTP
(diblokir peramban sebagai mixed content), dan alamat privat yang tidak dapat
dirutekan dari internet.

`EXPO_PUBLIC_*` ditanam saat **build**, bukan dibaca saat runtime — mengubah
variabelnya saja tidak cukup, bundelnya harus dibangun ulang. `frontend-cd.yml`
sekarang menolak build bila nilainya bukan `https://` atau menunjuk alamat
privat, lalu memeriksa lagi bundel hasilnya.

---

## 1. Database — Neon

1. Buat project di [neon.tech](https://neon.tech), region **Singapore**.
2. SQL Editor:

   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

   > `postgis_topology` **tidak tersedia di Neon** dan tidak dipakai skema ini.
   > Migrasi `20260517000000_init` sudah diubah agar melewatinya bila tidak ada.

3. Salin connection string **tanpa `-pooler`** (koneksi langsung). Render
   menjalankan satu proses panjang, bukan ratusan fungsi serverless, jadi pooler
   tidak diperlukan — dan Prisma Migrate memang tidak bisa lewat pooler.

4. Pastikan ada `?sslmode=require`.

Isi data awal sekali dari laptop:

```bash
DATABASE_URL='<connection string Neon>' pnpm --filter @bingo/backend exec ts-node prisma/seed.ts
```

Migrasi tidak perlu dijalankan manual — `render.yaml` menjalankannya di setiap
build.

---

## 2. API — Render

Dashboard Render → **New** → **Blueprint** → pilih repo ini. Render membaca
`render.yaml` dan menanyakan variabel yang bertanda `sync: false`:

| Nama | Nilai |
|---|---|
| `DATABASE_URL` | connection string Neon |
| `DIRECT_URL` | **sama persis** dengan `DATABASE_URL` |
| `JWT_SECRET` | `openssl rand -base64 48` |
| `CORS_ORIGINS` | `https://bingo-web-delta.vercel.app` |
| `BLOB_READ_WRITE_TOKEN` | dari Vercel Blob |

`DIRECT_URL` diisi sama karena skema Prisma memisahkan keduanya untuk kasus
serverless; di Render keduanya memang koneksi yang sama. Kalau dikosongkan,
Prisma gagal boot dengan "Environment variable not found: DIRECT_URL".

`CORS_ORIGINS` **tanpa garis miring di akhir**, dan harus persis sama dengan
origin web-nya. Kalau dikosongkan, API memantulkan origin mana pun dan mencetak
peringatan di log.

Setelah blueprint dibuat, Render **auto-deploy setiap push ke `main`**. Tidak
ada workflow CD untuk backend — `backend-cd.yml` sekarang manual saja dan hanya
dipakai kalau ingin kembali ke Vercel.

### Yang harus diketahui soal free tier

Service **tidur setelah 15 menit tanpa trafik**, dan bangunnya **~50 detik**.
`keepalive.yml` menyentuh `/health` tiap 10 menit untuk mencegahnya, tetapi cron
GitHub Actions bisa tertunda 5–15 menit pada jam sibuk — jadi itu mengurangi
peluang, bukan menghilangkannya.

**Menjelang demo juri, buka `/health` sendiri lima menit sebelum mulai.** Jangan
menggantungkan momen yang menentukan pada cron.

Kalau nanti butuh kepastian, naik ke plan berbayar ($7/bln) menghapus perilaku
tidur ini sepenuhnya dan tidak menuntut perubahan kode apa pun.

---

## 3. Web — Vercel

Project Vercel terpisah, root `apps/mobile`. Deploy dilakukan
`frontend-cd.yml` dari artefak `expo export`.

---

## 4. Secrets & variables GitHub

**Settings → Secrets and variables → Actions**

| Jenis | Nama | Nilai |
|---|---|---|
| Secret | `VERCEL_TOKEN` | Account Settings → Tokens |
| Secret | `VERCEL_ORG_ID` | dari `apps/mobile/.vercel/project.json` |
| Secret | `VERCEL_WEB_PROJECT_ID` | project id web |
| Variable | `EXPO_PUBLIC_API_BASE_URL` | `https://bingo-api-j4j6.onrender.com` |

---

## 5. Urutan menjalankan pertama kali

```
1. Neon dibuat, CREATE EXTENSION postgis
2. Render Blueprint dibuat, env diisi, tunggu deploy pertama selesai
3. curl https://bingo-api-j4j6.onrender.com/health   -> harus 200
4. Seed dari laptop
5. Set variable EXPO_PUBLIC_API_BASE_URL ke domain Render itu
6. Jalankan Frontend CD
7. Buka /login, masuk dengan akun seed
```

Langkah 3 tidak boleh dilewati. Web yang menunjuk API mati gagal dengan cara
yang sama persis seperti sebelumnya, dan waktunya habis mencari di tempat yang
salah.

---

## 6. Target deployment yang dipakai

Backend produksi hanya memakai Render. Frontend produksi hanya memakai project
Vercel `bingo-web`. Project backend Vercel dan project web percobaan telah
dihapus agar tidak ada domain mati yang keliru dianggap sebagai production.
