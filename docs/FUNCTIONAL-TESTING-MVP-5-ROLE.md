# BinGo MVP Lima Role: Functional Testing Manual

Dokumen ini menjadi lembar uji manual untuk web produksi dan APK BinGo. Jalankan pengujian pada data Demo. Setiap pengujian yang mengubah data harus mencatat waktu, akun, dan data yang dibuat agar mudah ditelusuri melalui Audit.

## 1. Informasi Sesi Uji

| Item                  | Isi                                   |
| --------------------- | ------------------------------------- |
| Tester                |                                       |
| Tanggal dan waktu     |                                       |
| Commit                |                                       |
| Web URL               | `https://bingo-web-delta.vercel.app`  |
| API URL               | `https://bingo-api-j4j6.onrender.com` |
| APK version           |                                       |
| Perangkat dan Android |                                       |
| Koneksi               | Wi-Fi / seluler / offline             |

Status hasil: `PASS`, `FAIL`, `BLOCKED`, atau `NOT RUN`.

## 2. Akun Seed Demo

Semua akun memakai kata sandi `demo12345678`.

| Role               | Nomor telepon    | Kanal utama                          |
| ------------------ | ---------------- | ------------------------------------ |
| Admin BinGo        | `+6281100000001` | Web                                  |
| Pengelola          | `+6281100000002` | Web                                  |
| Operator Pengelola | `+6281100000003` | Web                                  |
| Petugas Pengumpul  | `+6281100000004` | APK                                  |
| Warga              | `+6281100000006` | APK, web untuk pemeriksaan responsif |
| Business/Pengolah  | `+6281100000007` | Web                                  |
| Pemohon Pengelola  | `+6281100000009` | Web                                  |
| Pemohon Business   | `+6281100000010` | Web                                  |

Jangan memakai nomor atau dokumen identitas nyata. Semua data buatan tester harus memuat kata `Demo`.

## 3. Pemeriksaan Deployment

| ID     | Kanal | Langkah                                              | Hasil yang diharapkan                                                                             | Hasil | Catatan |
| ------ | ----- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----- | ------- |
| DEP-01 | API   | Buka `GET /health`                                   | HTTP 200, `status=ok`, database dan PostGIS `ok`                                                  |       |         |
| DEP-02 | Web   | Buka `/login` pada jendela privat                    | Halaman tampil tanpa layar putih dan tanpa mixed content                                          |       |         |
| DEP-03 | Web   | Muat ulang langsung pada salah satu route dashboard  | SPA tetap terbuka, bukan 404                                                                      |       |         |
| DEP-04 | Web   | Login setelah API Render tidur lebih dari 15 menit   | Ada loading state; login selesai setelah cold start atau menampilkan galat dan dapat dicoba ulang |       |         |
| DEP-05 | APK   | Pasang APK release dan buka aplikasi                 | Signature valid, aplikasi membuka layar masuk                                                     |       |         |
| DEP-06 | Semua | Matikan jaringan lalu buka layar yang mengambil data | Empty/error/offline state terlihat dan aplikasi tidak crash                                       |       |         |

## 4. Autentikasi dan Akses Role

| ID      | Kanal | Langkah                                                 | Hasil yang diharapkan                                      | Hasil | Catatan |
| ------- | ----- | ------------------------------------------------------- | ---------------------------------------------------------- | ----- | ------- |
| AUTH-01 | Web   | Isi format telepon salah dan kata sandi pendek          | Validasi inline muncul, request tidak dikirim              |       |         |
| AUTH-02 | Web   | Login sebagai Pengelola                                 | Masuk ke dashboard Pengelola                               |       |         |
| AUTH-03 | Web   | Login sebagai Business                                  | Masuk ke dashboard Business                                |       |         |
| AUTH-04 | Web   | Login sebagai Admin BinGo                               | Masuk ke dashboard Admin Platform                          |       |         |
| AUTH-05 | APK   | Login sebagai Warga                                     | Masuk ke tab Beranda Warga                                 |       |         |
| AUTH-06 | APK   | Login sebagai Petugas                                   | Masuk ke tab Hari Ini                                      |       |         |
| AUTH-07 | Semua | Masukkan kata sandi salah                               | Pesan galat inline konkret tampil dan tombol aktif kembali |       |         |
| AUTH-08 | Semua | Tutup dan buka kembali aplikasi                         | Sesi yang valid dipulihkan                                 |       |         |
| AUTH-09 | Semua | Tekan Keluar lalu konfirmasi                            | Token dihapus dan kembali ke layar masuk                   |       |         |
| AUTH-10 | Web   | Paksa buka route role lain melalui URL                  | Dialihkan ke halaman yang sesuai dengan role akun          |       |         |
| AUTH-11 | API   | Akses endpoint platform dengan token non-admin          | HTTP 403                                                   |       |         |
| AUTH-12 | API   | Akses resource organisasi lain dengan ID yang diketahui | HTTP 403 atau 404, data tidak bocor                        |       |         |

## 5. Registrasi dan Verifikasi Organisasi

### 5.1 Pemohon Pengelola atau Business

| ID     | Kanal | Langkah                                                   | Hasil yang diharapkan                                          | Hasil | Catatan |
| ------ | ----- | --------------------------------------------------------- | -------------------------------------------------------------- | ----- | ------- |
| ORG-01 | Web   | Pilih Daftar, lalu Pengelola                              | Form desktop tampil dengan lebar baca yang wajar               |       |         |
| ORG-02 | Web   | Daftar menggunakan nomor baru dan organisasi bernama Demo | Akun dibuat, organisasi berstatus `DRAFT`                      |       |         |
| ORG-03 | Web   | Lengkapi profil dan simpan                                | Data tetap ada setelah reload                                  |       |         |
| ORG-04 | Web   | Unggah dokumen dummy                                      | Dokumen tampil sebagai bukti privat                            |       |         |
| ORG-05 | Web   | Kirim pengajuan                                           | Status menjadi `PENDING_REVIEW`; menu transaksi tidak tersedia |       |         |
| ORG-06 | Web   | Login sebagai pemohon yang meminta perubahan              | Catatan Admin terlihat dan form dapat diperbaiki               |       |         |
| ORG-07 | Web   | Kirim ulang pengajuan                                     | Versi pengajuan bertambah dan kembali ke antrean               |       |         |

### 5.2 Review Admin

| ID     | Kanal | Langkah                                               | Hasil yang diharapkan                                   | Hasil | Catatan |
| ------ | ----- | ----------------------------------------------------- | ------------------------------------------------------- | ----- | ------- |
| ADM-01 | Web   | Buka Antrean Verifikasi                               | Pengajuan menunggu review tampil                        |       |         |
| ADM-02 | Web   | Pilih pengajuan                                       | Profil, wilayah, kapasitas, dan dokumen tampil          |       |         |
| ADM-03 | Web   | Minta perubahan dengan catatan                        | Status dan catatan tersimpan; Audit bertambah           |       |         |
| ADM-04 | Web   | Setujui pengajuan lain                                | Organisasi menjadi `ACTIVE`                             |       |         |
| ADM-05 | Web   | Tolak pengajuan dengan alasan                         | Status menjadi `REJECTED`; alasan dapat dilihat pemohon |       |         |
| ADM-06 | API   | Coba review tanpa alasan pada aksi yang mewajibkannya | Request ditolak dengan pesan validasi                   |       |         |
| ADM-07 | Web   | Coba membuka URL dokumen tanpa sesi berwenang         | Dokumen tidak dapat diakses                             |       |         |

## 6. Golden Path Warga

| ID    | Kanal | Langkah                                          | Hasil yang diharapkan                                                | Hasil | Catatan |
| ----- | ----- | ------------------------------------------------ | -------------------------------------------------------------------- | ----- | ------- |
| HH-01 | APK   | Buka Beranda                                     | Jadwal berikutnya, status layanan, invoice, dan aksi utama tampil    |       |         |
| HH-02 | APK   | Buka Layanan                                     | Paket, jadwal umum, dan permintaan pengambilan tampil                |       |         |
| HH-03 | APK   | Bayar invoice Demo                               | Loading tampil; invoice menjadi lunas dan tetap lunas setelah reload |       |         |
| HH-04 | API   | Kirim payment idempotency key yang sama dua kali | Hanya satu PaymentEvent dan satu perubahan invoice                   |       |         |
| HH-05 | APK   | Buka Jalur Setor                                 | Daftar fasilitas, material, sumber, dan tanggal verifikasi tampil    |       |         |
| HH-06 | APK   | Tekan Buka arah di Google Maps                   | Aplikasi Maps atau browser membuka koordinat tujuan yang benar       |       |         |
| HH-07 | APK   | Buat laporan sampah liar                         | Tombol disabled sebelum valid; laporan tampil setelah berhasil       |       |         |
| HH-08 | APK   | Buka kembali laporan                             | Status dan riwayat penanganan tampil                                 |       |         |
| HH-09 | Web   | Buka halaman Warga pada lebar desktop dan mobile | Konten tetap dapat dipakai tanpa overflow horizontal                 |       |         |

## 7. Golden Path Pengelola

| ID     | Kanal | Langkah                                          | Hasil yang diharapkan                                       | Hasil | Catatan |
| ------ | ----- | ------------------------------------------------ | ----------------------------------------------------------- | ----- | ------- |
| MGR-01 | Web   | Buka Ringkasan                                   | Metrik dan tugas penting tampil dengan skeleton saat memuat |       |         |
| MGR-02 | Web   | Buka Wilayah dan Pelanggan                       | Zona padat dan zona Mengumpulkan Minat tampil               |       |         |
| MGR-03 | Web   | Buka Tagihan                                     | Invoice warga dan status pembayaran tampil                  |       |         |
| MGR-04 | Web   | Buat rute dari dua alamat                        | Rute tersimpan dan masuk daftar pilihan                     |       |         |
| MGR-05 | Web   | Pilih rute, Petugas, waktu, lalu terbitkan tugas | Collection run dibuat dan tampil di Tugas terbaru           |       |         |
| MGR-06 | Web   | Buat akun Petugas Demo baru                      | Akun Petugas dibuat dan tampil pada daftar                  |       |         |
| MGR-07 | Web   | Terbitkan kartu untuk Petugas                    | Kartu aktif bertambah satu                                  |       |         |
| MGR-08 | Web   | Buat intake batch                                | Batch memiliki nomor dan status terbuka                     |       |         |
| MGR-09 | Web   | Catat berat masuk manual dan output pemilahan    | Weight event tercatat sesuai sumber `MANUAL`                |       |         |
| MGR-10 | Web   | Gunakan simulator timbang                        | Event berlabel `SIMULATOR`, bukan perangkat produksi        |       |         |
| MGR-11 | Web   | Coba sahkan output melebihi input                | Sistem menolak neraca massa                                 |       |         |
| MGR-12 | Web   | Sahkan batch 100 kg yang seimbang                | Inventory ledger bertambah sesuai keluaran                  |       |         |
| MGR-13 | Web   | Terbitkan lot dari inventory                     | Lot aktif tampil pada daftar pasokan Business               |       |         |
| MGR-14 | Web   | Tangani laporan warga dengan catatan             | Status menjadi selesai dan event riwayat tercatat           |       |         |

## 8. Golden Path Petugas

| ID     | Kanal       | Langkah                                          | Hasil yang diharapkan                                           | Hasil | Catatan |
| ------ | ----------- | ------------------------------------------------ | --------------------------------------------------------------- | ----- | ------- |
| COL-01 | APK         | Buka Hari Ini                                    | Tugas aktif, jumlah titik, dan status tampil                    |       |         |
| COL-02 | APK         | Buka Rute dan mulai titik pertama                | Status perhentian berubah dan waktunya tercatat                 |       |         |
| COL-03 | APK         | Tandai kendala pada titik                        | Catatan kendala tersimpan dan terlihat Pengelola                |       |         |
| COL-04 | APK         | Selesaikan perhentian                            | Status menjadi selesai dan tidak dapat diselesaikan dua kali    |       |         |
| COL-05 | Stasiun NFC | Tap kartu fisik pada mesin timbang               | Identitas Petugas ditemukan sebelum berat disahkan              |       |         |
| COL-06 | Web         | Gunakan nomor kartu tercetak pada mode cadangan  | Jalur backend sama dengan pembaca NFC stasiun                   |       |         |
| COL-07 | Web         | Timbang kartu Demo dan berat contoh              | Satu WeightEvent mencatat Petugas, stasiun, material, dan berat |       |         |
| COL-08 | API         | Kirim `deviceEventId` timbang yang sama dua kali | Hasil kedua `duplicate`; berat tidak berlipat                   |       |         |
| COL-09 | APK         | Buka Kontribusi Timbang                          | Riwayat dan total berat yang terhubung ke akun Petugas tampil   |       |         |
| COL-10 | Web         | Gunakan kartu tidak aktif                        | Timbang ditolak dan tidak membuat WeightEvent                   |       |         |

## 9. Golden Path Business/Pengolah

| ID     | Kanal | Langkah                                                       | Hasil yang diharapkan                                              | Hasil | Catatan |
| ------ | ----- | ------------------------------------------------------------- | ------------------------------------------------------------------ | ----- | ------- |
| BUS-01 | Web   | Buat kebutuhan organik minimal 50 kg                          | Kebutuhan tampil pada Publikasi saya                               |       |         |
| BUS-02 | Web   | Buka Pasokan dan pilih lot                                    | Detail organisasi, volume, dan harga tampil                        |       |         |
| BUS-03 | Web   | Pesan sebagian lot                                            | Purchase order terbentuk dan volume lot tereservasi                |       |         |
| BUS-04 | API   | Dua Business memesan sisa kilogram yang sama secara bersamaan | Hanya reservasi yang valid berhasil; inventory tidak negatif       |       |         |
| BUS-05 | Web   | Buka Pesanan                                                  | Nomor pesanan, status, jumlah, dan nilai tampil                    |       |         |
| BUS-06 | Web   | Konfirmasi penerimaan serta residu                            | MaterialReceipt tersimpan dan status pesanan berubah               |       |         |
| BUS-07 | Web   | Buka Ringkasan                                                | Diversion baru bertambah setelah penerimaan, bukan saat pemesanan  |       |         |
| BUS-08 | Web   | Login sebagai Business belum aktif                            | Hanya onboarding, status verifikasi, dan bantuan yang dapat dibuka |       |         |

## 10. Governansi Admin BinGo

| ID     | Kanal | Langkah                                                     | Hasil yang diharapkan                                                 | Hasil | Catatan |
| ------ | ----- | ----------------------------------------------------------- | --------------------------------------------------------------------- | ----- | ------- |
| GOV-01 | Web   | Tambah fasilitas Demo                                       | Entri menyimpan operator, lokasi, material, dan sumber                |       |         |
| GOV-02 | Web   | Verifikasi fasilitas                                        | Tanggal dan catatan verifikasi diperbarui                             |       |         |
| GOV-03 | Web   | Sembunyikan kebutuhan atau lot                              | Dialog konfirmasi berfungsi; publikasi tidak tampil di katalog        |       |         |
| GOV-04 | Web   | Pulihkan publikasi                                          | Publikasi kembali tampil                                              |       |         |
| GOV-05 | Web   | Suspend organisasi Demo                                     | Dialog konfirmasi berfungsi; status menjadi `SUSPENDED`               |       |         |
| GOV-06 | API   | Buat transaksi baru sebagai organisasi suspended            | Request ditolak                                                       |       |         |
| GOV-07 | Web   | Lihat data lama organisasi suspended                        | Invoice, timbang, pesanan, dan bukti lama tetap ada                   |       |         |
| GOV-08 | Web   | Aktifkan kembali organisasi                                 | Transaksi baru diizinkan kembali                                      |       |         |
| GOV-09 | Web   | Buka Audit                                                  | Keputusan review, moderasi, dan suspensi memuat pelaku, waktu, alasan |       |         |
| GOV-10 | API   | Coba ubah timbang, invoice, atau pesanan melalui akun Admin | Ditolak karena Admin tidak memiliki bypass transaksi tenant           |       |         |

## 11. UX, Responsif, dan Aksesibilitas

Uji pada lebar 360, 768, 1280, dan 1440 piksel.

| ID    | Kanal  | Langkah                                                  | Hasil yang diharapkan                                                       | Hasil | Catatan |
| ----- | ------ | -------------------------------------------------------- | --------------------------------------------------------------------------- | ----- | ------- |
| UX-01 | Web    | Buka login pada 1280 px                                  | Panel identitas dan kartu form dua kolom tampil; input tidak memenuhi layar |       |         |
| UX-02 | Mobile | Buka login                                               | Satu kolom ringkas tanpa panel desktop                                      |       |         |
| UX-03 | Web    | Arahkan pointer ke tombol, kartu interaktif, dan sidebar | Hover state terlihat dan cursor sesuai                                      |       |         |
| UX-04 | Semua  | Tekan aksi yang memanggil API                            | Tombol disabled dan spinner tampil sampai request selesai                   |       |         |
| UX-05 | Semua  | Fokus input lalu picu validasi                           | Border fokus terlihat; galat tidak hanya dibedakan dengan warna             |       |         |
| UX-06 | Web    | Navigasi semua menu dashboard                            | Active state dan judul halaman sesuai route                                 |       |         |
| UX-07 | Semua  | Periksa target tombol                                    | Target sentuh minimal 44 dp                                                 |       |         |
| UX-08 | Semua  | Uji dengan pembaca layar                                 | Input berlabel; status busy, disabled, dan dialog diumumkan                 |       |         |
| UX-09 | Semua  | Periksa empty/error/retry                                | Tidak ada layar kosong tanpa penjelasan atau tindakan                       |       |         |
| UX-10 | Web    | Tekan konfirmasi Suspend, Moderasi, Batalkan, dan Keluar | Dialog bekerja tanpa bergantung pada Alert native                           |       |         |

## 12. CRUD dan Pola List-First

| ID      | Kanal                      | Langkah                                                                                                     | Hasil yang diharapkan                                                                                       | Hasil | Catatan |
| ------- | -------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----- | ------- |
| CRUD-01 | Web Pengelola              | Buka Wilayah dan Pelanggan                                                                                  | Daftar tampil; form Tambah tidak terlihat                                                                   |       |         |
| CRUD-02 | Web Pengelola              | Tekan Tambah Wilayah, isi, lalu Batal                                                                       | Drawer terbuka; Batal tidak menyimpan                                                                       |       |         |
| CRUD-03 | Web Pengelola              | Edit satu wilayah dan simpan                                                                                | Daftar diperbarui tanpa reload penuh                                                                        |       |         |
| CRUD-04 | Web Pengelola              | Arsipkan wilayah Demo dengan alasan                                                                         | Hilang dari Aktif dan muncul pada Diarsipkan                                                                |       |         |
| CRUD-05 | Web Pengelola              | Pulihkan wilayah dari Diarsipkan                                                                            | Kembali ke daftar Aktif dan audit bertambah                                                                 |       |         |
| CRUD-06 | Web                        | Ubah isi drawer lalu tekan Escape                                                                           | Konfirmasi perubahan belum disimpan tampil                                                                  |       |         |
| CRUD-07 | Web                        | Cari resource lalu pindah halaman                                                                           | Filter dan pagination memuat hasil yang sesuai                                                              |       |         |
| CRUD-08 | Web Operator               | Coba membuat Petugas                                                                                        | Ditolak karena hanya Admin Pengelola yang berwenang                                                         |       |         |
| CRUD-09 | Web Pengelola              | Edit rute yang sudah pernah dijalankan, lalu pilih Buat Revisi                                              | Edit ditolak; revisi baru dibuat tanpa mengubah riwayat                                                     |       |         |
| CRUD-10 | Web Business               | Buat kebutuhan material                                                                                     | Status awal `DRAFT`; belum tampil sebagai publikasi aktif                                                   |       |         |
| CRUD-11 | Web Business               | Publikasikan lalu tutup kebutuhan                                                                           | Status berurutan `PUBLISHED` lalu `CLOSED`                                                                  |       |         |
| CRUD-12 | Web Pengelola              | Buat lot lalu Terbitkan                                                                                     | Lot berawal `DRAFT` dan baru tampil pada Pasokan setelah diterbitkan                                        |       |         |
| CRUD-13 | Web Admin                  | Edit nama publik kategori, arsipkan, lalu pulihkan                                                          | Kode sistem tetap; metadata dan status berubah                                                              |       |         |
| CRUD-14 | Web Admin                  | Buka tiket bantuan, balas, Resolve, lalu Reopen                                                             | Pesan dan lifecycle tersimpan pada tiket yang sama                                                          |       |         |
| CRUD-15 | APK Warga                  | Edit lalu tarik laporan berstatus `SUBMITTED`                                                               | Edit tersimpan; laporan dapat ditarik sebelum verifikasi                                                    |       |         |
| CRUD-16 | APK Warga                  | Coba edit laporan yang sudah diverifikasi                                                                   | Form read-only dan API menolak mutasi                                                                       |       |         |
| CRUD-17 | Web Business               | Buka Penerimaan                                                                                             | Form berat tidak tampil sebelum satu pesanan dibuka                                                         |       |         |
| CRUD-18 | Web Admin                  | Buka Fasilitas                                                                                              | Daftar tampil; Tambah, Edit, Verifikasi, Arsip, dan Restore bersifat kontekstual                            |       |         |
| CRUD-19 | Web Pengelola              | Edit Rumah Tangga dan isi nomor akun Warga                                                                  | Akun tertaut; nomor yang telah dipakai rumah tangga lain ditolak                                            |       |         |
| CRUD-20 | Web Pengelola              | Edit daftar kanal pada Stasiun Timbang                                                                      | Kanal baru ditambah; kanal yang dihapus dari form menjadi nonaktif tanpa menghapus weight event lama        |       |         |
| CRUD-21 | Web Pengelola              | Tekan Ajukan verifikasi pada Fasilitas                                                                      | Status pengajuan terlihat dan tombol tidak dapat dikirim berulang sebelum ditinjau Admin                    |       |         |
| CRUD-22 | APK Warga dan Web tenant   | Buat tiket melalui halaman Bantuan, lalu buka ulang                                                         | Tiket dan balasan Admin tetap tersedia setelah reload atau login ulang                                      |       |         |
| CRUD-23 | Web Admin                  | Buka Antrean Verifikasi, Organisasi, Business, Moderasi, Fasilitas, Kategori Material, dan Bantuan          | Seluruh halaman membuka tabel/list; form atau keputusan baru muncul setelah tindakan kontekstual            |       |         |
| CRUD-24 | Web Pengelola dan Business | Buka seluruh menu administratif dari sidebar                                                                | Halaman CRUD membuka daftar terlebih dahulu; onboarding dan workflow detail menjadi pengecualian yang jelas |       |         |
| UX-11   | Web semua role             | Berpindah antaritem sidebar termasuk halaman turunan                                                        | Menu induk aktif memiliki latar, garis kiri, ikon, dan teks hijau; judul topbar mengikuti menu aktif        |       |         |
| UX-12   | Web semua role             | Arahkan pointer, fokuskan dengan keyboard, lalu tekan tombol primer, sekunder, ghost, ikon, chip, dan kartu | Hover, focus ring, pressed, disabled, serta loading terlihat dan tidak mengubah layout                      |       |         |

## 13. Regresi Otomatis Sebelum Sign-off

Jalankan dari root repository:

```bash
pnpm shared:build
pnpm --filter @bingo/backend exec prisma format --check
pnpm --filter @bingo/backend exec prisma validate
pnpm --filter @bingo/backend build
pnpm --filter @bingo/backend test --runInBand
pnpm --filter @bingo/backend test:e2e
pnpm --filter @bingo/mobile typecheck
pnpm --filter @bingo/mobile test --runInBand
EXPO_PUBLIC_API_BASE_URL=https://bingo-api-j4j6.onrender.com \
EXPO_PUBLIC_WEB_BUILD=1 \
EXPO_NO_DOTENV=1 \
pnpm --filter @bingo/mobile exec expo export --clear --platform web
```

| Pemeriksaan                          | Hasil | Catatan |
| ------------------------------------ | ----- | ------- |
| Shared packages build                |       |         |
| Prisma format dan validate           |       |         |
| Backend build                        |       |         |
| Backend unit tests                   |       |         |
| Backend E2E PostgreSQL/PostGIS       |       |         |
| Mobile typecheck                     |       |         |
| Mobile tests                         |       |         |
| Expo web export                      |       |         |
| APK build dan signature verification |       |         |

## 14. Temuan

| Bug ID | Test ID | Severity | Kanal | Langkah reproduksi | Aktual | Harapan | Bukti | Status |
| ------ | ------- | -------- | ----- | ------------------ | ------ | ------- | ----- | ------ |
|        |         |          |       |                    |        |         |       |        |

Severity:

- `S1`: kehilangan data, kebocoran otorisasi, atau golden path tidak dapat diteruskan.
- `S2`: fitur inti gagal tetapi ada workaround.
- `S3`: masalah UX atau validasi tanpa kehilangan data.
- `S4`: kosmetik.

## 15. Sign-off

| Peran       | Nama | Keputusan           | Tanggal | Catatan |
| ----------- | ---- | ------------------- | ------- | ------- |
| QA          |      | Lulus / Belum lulus |         |         |
| Product     |      | Lulus / Belum lulus |         |         |
| Engineering |      | Lulus / Belum lulus |         |         |

MVP dinyatakan siap demo apabila seluruh test S1/S2 pada golden path lima role berstatus `PASS`, tidak ada data lintas organisasi yang bocor, dan web serta APK menggunakan API produksi yang sama.
