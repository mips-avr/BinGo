-- =====================================================================
-- BinGo — Hapus NIK, ganti dengan verifikasi berjenjang mitra
--
-- Menghapus:
--   1) users.nik beserta indeks uniknya.
--
-- Menambahkan:
--   2) enum "AttestorType", "AgentVerificationStatus",
--      "AgentVerificationAction".
--   3) users.verification_level (0/1/2, nilai turunan) serta
--      users.partner_type & users.partner_name untuk akun operator mitra.
--   4) tabel agent_verifications — identitas penjamin, tanggal, status.
--   5) tabel agent_verification_events — jejak audit penjaminan.
--   6) tabel agent_endorsements — rekomendasi sesama pemulung Tingkat 2.
--   7) weighing_receipts.disputed_at & dispute_reason — sengketa penyetor,
--      dasar syarat "10 transaksi nirsengketa".
--
-- PERINGATAN yang diwariskan dari migrasi 20260806101500: dua indeks GIST
-- ekspresi berikut TIDAK dapat dinyatakan di schema.prisma —
--   pickup_requests_location_geog_gist
--   reports_location_geog_gist
-- sehingga `prisma migrate dev` akan menuliskan DROP INDEX untuk keduanya pada
-- setiap migrasi yang dihasilkan otomatis. Migrasi ini ditulis tangan dan
-- sengaja TIDAK memuat DROP INDEX tersebut. Bila kelak melihatnya muncul pada
-- migrasi baru, hapus baris itu sebelum di-commit; tanpa kedua indeks ini
-- setiap pemuatan radar memindai seluruh tabel pickup_requests.
-- =====================================================================

-- 1) Hapus NIK -----------------------------------------------------------
-- Pencocokan NIK ke sumber resmi memerlukan perjanjian kerja sama dengan
-- Ditjen Dukcapil (Permendagri 102/2019). Tim ini tidak memilikinya, sehingga
-- 16 digit yang tersimpan tidak pernah dapat dibuktikan milik penggunanya.
-- Yang tersisa hanyalah data pribadi berisiko tinggi tanpa jaminan apa pun.
--
-- Kolom dihapus, bukan dikosongkan: kolom kosong yang masih ada akan terisi
-- kembali begitu ada yang menambahkan satu baris kode, dan klaim "tidak
-- menyimpan NIK" kembali menjadi janji lisan alih-alih sifat basis data.
DROP INDEX IF EXISTS "users_nik_key";
ALTER TABLE "users" DROP COLUMN IF EXISTS "nik";

-- 2) Enum verifikasi berjenjang -----------------------------------------
CREATE TYPE "AttestorType" AS ENUM (
    'BANK_SAMPAH',
    'LAPAK',
    'TPS3R',
    'KSM_PERSAMPAHAN',
    'RT_RW'
);

CREATE TYPE "AgentVerificationStatus" AS ENUM (
    'MENUNGGU',
    'DISETUJUI',
    'DITOLAK',
    'DICABUT'
);

CREATE TYPE "AgentVerificationAction" AS ENUM (
    'DIAJUKAN',
    'DISETUJUI',
    'DITOLAK',
    'DICABUT'
);

-- 3) Kolom baru pada users ----------------------------------------------
-- verification_level adalah nilai TURUNAN dari agent_verifications,
-- agent_endorsements, dan weighing_receipts. Disimpan karena dibaca pada
-- setiap penerimaan pekerjaan dan penerbitan bukti timbang; hanya
-- AgentVerificationsService.recomputeLevel() yang boleh menulisnya.
ALTER TABLE "users"
    ADD COLUMN "verification_level" INTEGER NOT NULL DEFAULT 0;

-- Diisi hanya untuk akun operator mitra terdaftar. Tidak ada endpoint yang
-- menyetelnya: pendaftaran mitra dilakukan di luar aplikasi. Bila akun mana
-- pun dapat menandai dirinya sendiri sebagai mitra, dua akun Tingkat 0 tinggal
-- saling menjamin dan seluruh jenjang ini runtuh.
ALTER TABLE "users"
    ADD COLUMN "partner_type" "AttestorType",
    ADD COLUMN "partner_name" VARCHAR(160);

-- Pemulung yang sudah ada TIDAK dinaikkan tingkatnya oleh migrasi ini.
-- Migrasi tidak punya cara jujur untuk mengarang siapa penjamin mereka, dan
-- penjaminan karangan persis merupakan hal yang hendak dicegah mekanisme ini.
-- Konsekuensinya disengaja: setelah migrasi, setiap pemulung lama berada di
-- Tingkat 0 dan harus mengajukan penjaminan sebelum dapat menerima pekerjaan
-- lagi. Untuk basis data demo, seed menyiapkan penjaminan yang lengkap.

-- 4) Tabel: agent_verifications -----------------------------------------
CREATE TABLE "agent_verifications" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "attestor_id" TEXT NOT NULL,
    "attestor_type" "AttestorType" NOT NULL,
    "attestor_name" VARCHAR(160) NOT NULL,
    "attestor_phone" VARCHAR(20) NOT NULL,
    "attestor_key" VARCHAR(180) NOT NULL,
    "status" "AgentVerificationStatus" NOT NULL DEFAULT 'MENUNGGU',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMP(3),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "agent_verifications_pkey" PRIMARY KEY ("id")
);

-- Satu lembaga hanya boleh menjamin satu pemulung satu kali. Aturan ini
-- ditegakkan basis data, bukan hanya kode: tanpanya syarat Tingkat 2
-- "penjaminan kedua dari lembaga BERBEDA" dapat dipenuhi dengan mengajukan
-- lembaga yang sama dua kali.
CREATE UNIQUE INDEX "agent_verifications_agent_id_attestor_key_key"
    ON "agent_verifications" ("agent_id", "attestor_key");

CREATE INDEX "agent_verifications_agent_id_status_idx"
    ON "agent_verifications" ("agent_id", "status");

CREATE INDEX "agent_verifications_attestor_id_status_idx"
    ON "agent_verifications" ("attestor_id", "status");

ALTER TABLE "agent_verifications"
    ADD CONSTRAINT "agent_verifications_agent_id_fkey"
    FOREIGN KEY ("agent_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "agent_verifications"
    ADD CONSTRAINT "agent_verifications_attestor_id_fkey"
    FOREIGN KEY ("attestor_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 5) Tabel: agent_verification_events -----------------------------------
-- Kolom status hanya menyimpan keadaan terakhir. Bila penjaminan dicabut,
-- tanpa tabel ini tidak ada apa pun yang menunjukkan bahwa penjaminan itu
-- pernah disetujui, kapan, dan oleh siapa dicabut.
CREATE TABLE "agent_verification_events" (
    "id" TEXT NOT NULL,
    "verification_id" TEXT NOT NULL,
    "action" "AgentVerificationAction" NOT NULL,
    "actor_id" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "agent_verification_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "agent_verification_events_verification_id_created_at_idx"
    ON "agent_verification_events" ("verification_id", "created_at");

ALTER TABLE "agent_verification_events"
    ADD CONSTRAINT "agent_verification_events_verification_id_fkey"
    FOREIGN KEY ("verification_id") REFERENCES "agent_verifications"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Jejak audit harus bertahan lebih lama daripada akun pelakunya, jadi
-- penghapusan pengguna hanya mengosongkan actor_id, tidak menghapus barisnya.
ALTER TABLE "agent_verification_events"
    ADD CONSTRAINT "agent_verification_events_actor_id_fkey"
    FOREIGN KEY ("actor_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 6) Tabel: agent_endorsements ------------------------------------------
CREATE TABLE "agent_endorsements" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "endorser_id" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "agent_endorsements_pkey" PRIMARY KEY ("id")
);

-- "Satu perekomendasi satu suara", ditegakkan basis data seperti pada
-- report_verifications.
CREATE UNIQUE INDEX "agent_endorsements_agent_id_endorser_id_key"
    ON "agent_endorsements" ("agent_id", "endorser_id");

CREATE INDEX "agent_endorsements_endorser_id_idx"
    ON "agent_endorsements" ("endorser_id");

ALTER TABLE "agent_endorsements"
    ADD CONSTRAINT "agent_endorsements_agent_id_fkey"
    FOREIGN KEY ("agent_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "agent_endorsements"
    ADD CONSTRAINT "agent_endorsements_endorser_id_fkey"
    FOREIGN KEY ("endorser_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 7) Sengketa bukti timbang ---------------------------------------------
-- Bukti timbang sejak awal digambarkan sebagai dokumen dua pihak yang boleh
-- diperiksa dan dipersoalkan penyetor, tetapi tidak pernah ada jalur untuk
-- mempersoalkannya. Kolom ini yang juga membuat syarat Tingkat 2 "10 transaksi
-- nirsengketa" dapat dihitung; tanpanya syarat itu menghitung seluruh
-- transaksi dan tidak menyaring apa pun.
ALTER TABLE "weighing_receipts"
    ADD COLUMN "disputed_at" TIMESTAMP(3),
    ADD COLUMN "dispute_reason" VARCHAR(500);
