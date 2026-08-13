# Deployment Backend BinGo

Backend produksi BinGo menggunakan layanan yang memiliki paket gratis:

- **Render Web Service** untuk REST API NestJS;
- **Neon PostgreSQL** dengan ekstensi PostGIS untuk data aplikasi dan operasi geospasial;
- **Vercel Blob** untuk penyimpanan permanen foto laporan.

Konfigurasi layanan ada di [`render.yaml`](../render.yaml). Render menjalankan
migrasi Prisma sebelum API dijalankan, memakai Node.js 22 dan region Singapore.
Endpoint kesehatan tersedia di `GET /health`.

## Variabel lingkungan

| Nama                    | Keterangan                                               |
| ----------------------- | -------------------------------------------------------- |
| `DATABASE_URL`          | Connection string PostgreSQL dari integrasi Neon         |
| `JWT_SECRET`            | Secret acak minimal 32 karakter; jangan disimpan di Git  |
| `JWT_EXPIRES_IN`        | Masa berlaku token, default `7d`                         |
| `BLOB_READ_WRITE_TOKEN` | Token Vercel Blob untuk foto dan dokumen persisten       |
| `NODE_ENV`              | `production` untuk deployment produksi                   |
| `PUBLIC_BASE_URL`       | Opsional; URL HTTPS backend tanpa trailing slash         |

`BLOB_READ_WRITE_TOKEN`, `DATABASE_URL`, dan `JWT_SECRET` adalah rahasia. Nilainya
disimpan sebagai environment variable di Render, bukan di repository atau APK.

## Migrasi dan seed database

Render menjalankannya otomatis pada setiap deploy. Untuk pemulihan manual,
jalankan dari root monorepo setelah environment produksi tersedia:

```bash
pnpm --filter @bingo/backend prisma:migrate:deploy
pnpm --filter @bingo/backend prisma:seed
```

`migrate:deploy` hanya menerapkan migrasi yang sudah dilacak di Git. Seed bersifat
idempoten dan dapat dijalankan ulang untuk menyiapkan data demo WasteMart.

## Menghubungkan APK

Build mobile membaca URL backend melalui `EXPO_PUBLIC_API_BASE_URL`. Repository
variable GitHub dengan nama yang sama harus berisi origin HTTPS backend, misalnya:

```text
https://bingo-api-j4j6.onrender.com
```

Nilai ini dimasukkan saat build APK. Perubahan URL memerlukan build APK baru;
empat signing secret Android tetap terpisah dan tidak berhubungan dengan
credential database.

## Pemeriksaan setelah deploy

1. `GET /health` mengembalikan status sehat untuk API, database, dan PostGIS.
2. Registrasi dan login menghasilkan JWT.
3. Endpoint yang dilindungi menolak request tanpa bearer token.
4. Upload gambar mengembalikan URL `https://*.public.blob.vercel-storage.com/...`.
5. APK dapat login, membaca data, dan mengirim laporan melalui jaringan publik.

Ukuran foto dibatasi 4 MB agar request multipart tetap berada di bawah batas body
Vercel Functions. Aplikasi lokal tetap dapat menggunakan PostgreSQL Docker dan
penyimpanan file lokal tanpa credential cloud.
