# Kontrak CRUD dan List-First BinGo

Dokumen ini menjadi sumber implementasi untuk halaman manajemen domain pivot lima role. Domain transaksi lama tidak digunakan oleh navigasi MVP.

## Konvensi daftar

Endpoint daftar resource menerima `page`, `pageSize`, `search`, `status`, `sort`, dan `archived`. Bentuk respons resource Pengelola dan kebutuhan Business adalah:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "total": 0
}
```

Identitas organisasi selalu berasal dari token dan membership aktif. Client tidak mengirim `organizationId`. Resource tenant lain dikembalikan sebagai `404` atau ditolak oleh role guard. Payload update memakai whitelist per resource.

## Endpoint resource

### Pengelola

Base URL: `/api/v1/manager/resources/:resource`

Resource yang tersedia: `service-areas`, `households`, `service-plans`, `calendars`, `routes`, `vehicles`, `collectors`, `weigh-stations`, `facilities`, dan `lots`.

| Method | Path | Fungsi |
| --- | --- | --- |
| `GET` | `/:resource` | Daftar terfilter dan berhalaman |
| `GET` | `/:resource/:id` | Detail tenant-scoped |
| `POST` | `/:resource` | Membuat master atau draft |
| `PATCH` | `/:resource/:id` | Memperbarui field yang diizinkan |
| `POST` | `/:resource/:id/archive` | Mengarsipkan dengan alasan |
| `POST` | `/:resource/:id/restore` | Memulihkan dengan alasan |
| `DELETE` | `/:resource/:id` | Menghapus draft tanpa relasi yang didukung |
| `POST` | `/:resource/:id/action` | Lifecycle `publish`, `close`, `duplicate`, atau `request-verification` |

Rute yang sudah digunakan tidak dapat diedit. Aksi `duplicate` membuat revisi baru dan mempertahankan rute lama. Lot dibuat sebagai `DRAFT`, kemudian memakai `publish` dan `close`.

Rumah tangga dapat ditautkan ke akun Warga menggunakan nomor telepon yang sudah terdaftar. Satu akun hanya dapat terhubung ke satu rumah tangga. Kanal stasiun timbang yang tidak lagi dipakai dinonaktifkan, bukan dihapus, agar weight event lama tetap dapat ditelusuri. Pengajuan verifikasi fasilitas dicatat sampai Admin memverifikasi atau meminta perbaikan data.

### Business

Base URL: `/api/v1/business/resources/requirements`.

Kebutuhan material dibuat sebagai `DRAFT`. Update hanya berlaku pada draft. Lifecycle yang didukung adalah `publish`, `unpublish`, `close`, `archive`, `restore`, dan `delete` untuk draft tanpa relasi.

### Admin BinGo

- `/api/v1/platform/facilities`: list, create, update, archive, restore, dan verify.
- `/api/v1/platform-management/material-categories`: edit metadata, archive, dan restore enam kode sistem.
- `/api/v1/platform-management/support-tickets`: create/read dari halaman Bantuan Warga, Pengelola, atau Business; assign, reply, resolve, reopen, dan archive oleh Admin.
- Audit, review organisasi, pembayaran, timbang, ledger, serta penerimaan tetap append-only.

### Warga dan Petugas

- Warga dapat mengubah atau menarik `/api/v1/pivot/reports/:id` hanya ketika `SUBMITTED`.
- Pengelola mengubah status laporan melalui event baru.
- Petugas hanya membaca tugas sendiri dan memperbarui status perhentian.
- Card tap dan weight event tetap idempoten memakai `deviceEventId`.

## Kontrak antarmuka

Halaman manajemen membuka daftar, pencarian, filter Aktif/Diarsipkan, dan pagination. Form baru muncul setelah Tambah atau Edit. Form sederhana memakai drawer kanan. Penanganan laporan, rute, timbang, pesanan, dan penerimaan menggunakan konteks satu resource.

Setiap drawer mendukung tombol Tutup, Escape, backdrop, konfirmasi perubahan belum disimpan, loading, validasi, success, error, dan retry. Aksi berbahaya selalu menyebut resource serta dampaknya.

## Traceability

| Masalah | Role | UI | API | Bukti uji |
| --- | --- | --- | --- | --- |
| Data master sulit dipantau | Pengelola | Tabel, pencarian, arsip | Manager resources | `CRUD-01` sampai `CRUD-08` |
| Rute bersejarah berubah | Pengelola | Buat Revisi | route `duplicate` | `CRUD-09` |
| Publikasi prematur | Business/Pengelola | Draft lalu Publish | requirement/lot lifecycle | `CRUD-10` sampai `CRUD-12` |
| Metadata material hard-coded | Admin | Tabel kategori | material categories | `CRUD-13` |
| Dukungan tidak terlacak | Semua/Admin | Tiket bantuan | support tickets | `CRUD-14` |
| Laporan warga tidak dapat dikoreksi | Warga | Detail laporan | update/withdraw report | `CRUD-15` |
| Kebocoran tenant | Semua organisasi | Tidak ditampilkan | membership scope + whitelist | E2E tenant isolation |
| Mutasi tanpa bukti | Semua | Feedback status | `AuditEvent` | Audit dashboard dan E2E |
