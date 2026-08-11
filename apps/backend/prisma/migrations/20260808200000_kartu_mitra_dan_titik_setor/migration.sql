-- =====================================================================
-- BinGo — Kartu Mitra dan direktori titik setor.
--
-- Menambahkan:
--   1) users.phone dan users.password_hash menjadi NULLABLE, supaya seorang
--      penyetor dapat memiliki akun sungguhan sebelum memiliki ponsel.
--   2) tabel drop_points + kolom PostGIS + indeks GIST ekspresi.
--   3) tabel member_cards.
--
-- Perubahan (1) adalah yang paling perlu dijelaskan. Seluruh nilai BinGo —
-- bukti timbang, riwayat, tingkat verifikasi — mensyaratkan akun, dan akun
-- mensyaratkan ponsel. Pihak yang paling membutuhkan bukti timbang justru
-- yang paling mungkin tidak punya ponsel. Setelah migrasi ini, bank sampah
-- dapat menerbitkan kartu yang MENJADI akun itu sendiri; pemegangnya
-- mengaksesnya dengan menempelkan kartu di konter. Ketika ia kelak punya
-- ponsel, akun yang sama tinggal diklaim beserta seluruh riwayatnya.
--
-- Postgres mengizinkan banyak NULL pada kolom UNIQUE, sehingga keunikan
-- nomor telepon tetap terjaga bagi akun yang memilikinya.
-- =====================================================================

-- 1) Akun tanpa ponsel ---------------------------------------------------
ALTER TABLE "users" ALTER COLUMN "phone" DROP NOT NULL;
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;

-- Sebuah akun harus dapat diakses lewat SALAH SATU jalur: kata sandi, atau
-- kartu. Akun tanpa kata sandi dan tanpa kartu tidak dapat dimasuki siapa
-- pun dan hanya menjadi baris yatim. Batasan ini ditegakkan di lapisan
-- aplikasi (MemberCardsService selalu menerbitkan kartu dalam transaksi yang
-- sama dengan pembuatan akun); dicatat di sini agar niatnya terbaca oleh
-- siapa pun yang membaca skema.

-- 2) Titik setor ---------------------------------------------------------
CREATE TYPE "DropPointOperator" AS ENUM (
  'BINGO_MITRA', 'BANK_SAMPAH_DKI', 'REKOSISTEM', 'PLASTICPAY',
  'DLH_DKI_EWASTE', 'LAINNYA'
);

CREATE TYPE "DropPointReward" AS ENUM ('TUNAI', 'POIN', 'TIDAK_ADA');

CREATE TABLE "drop_points" (
    "id"                 TEXT NOT NULL,
    "name"               VARCHAR(160) NOT NULL,
    "operator"           "DropPointOperator" NOT NULL,
    "operator_name"      VARCHAR(160),
    "address"            VARCHAR(255) NOT NULL,
    "lat"                DOUBLE PRECISION NOT NULL,
    "lng"                DOUBLE PRECISION NOT NULL,
    "location"           geometry(Point, 4326),
    "accepted_materials" "MaterialType"[] NOT NULL,
    "reward"             "DropPointReward" NOT NULL,
    "min_weight_kg"      DECIMAL(6,2),
    "opening_note"       VARCHAR(255),
    "external_url"       VARCHAR(500),
    -- Wajib NOT NULL. Sebuah entri tanpa sumber tidak boleh masuk direktori
    -- ini: ia akan tampil sama meyakinkannya dengan entri yang terverifikasi,
    -- dan pengguna tidak punya cara membedakannya.
    "source_url"         VARCHAR(500) NOT NULL,
    "verified_at"        TIMESTAMP(3) NOT NULL,
    "note"               VARCHAR(500),
    "region"             VARCHAR(120) NOT NULL,
    "region_key"         VARCHAR(140) NOT NULL,
    "active"             BOOLEAN NOT NULL DEFAULT true,
    "created_at"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"         TIMESTAMP(3) NOT NULL,
    CONSTRAINT "drop_points_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "drop_points_region_key_idx" ON "drop_points" ("region_key");
CREATE INDEX "drop_points_operator_idx"   ON "drop_points" ("operator");
CREATE INDEX "drop_points_active_idx"     ON "drop_points" ("active");

-- Indeks GIST pada EKSPRESI (location::geography), bukan pada kolom mentah.
-- ST_DWithin dipanggil dengan argumen geography agar jaraknya dalam meter di
-- permukaan bumi; indeks pada geometry tidak akan dipakai oleh query itu.
-- Pola yang sama dipakai pickup_requests dan reports.
CREATE INDEX "drop_points_location_geog_gix"
    ON "drop_points" USING GIST ((location::geography));

-- Jaga agar kolom PostGIS tidak pernah menyimpang dari lat/lng. Titik setor
-- ditulis jarang (seeding dan kurasi manual), jadi trigger lebih murah
-- daripada mengandalkan setiap jalur tulis mengingat memanggil ST_SetSRID.
CREATE OR REPLACE FUNCTION bingo_drop_point_sync_location()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER drop_points_sync_location
    BEFORE INSERT OR UPDATE OF lat, lng ON "drop_points"
    FOR EACH ROW EXECUTE FUNCTION bingo_drop_point_sync_location();

-- 3) Kartu Mitra ---------------------------------------------------------
CREATE TYPE "MemberCardStatus" AS ENUM ('AKTIF', 'DIBEKUKAN', 'HILANG');

CREATE TABLE "member_cards" (
    "id"           TEXT NOT NULL,
    "card_number"  VARCHAR(16) NOT NULL,
    "card_uid"     VARCHAR(32),
    "holder_id"    TEXT NOT NULL,
    "issued_by_id" TEXT NOT NULL,
    "status"       "MemberCardStatus" NOT NULL DEFAULT 'AKTIF',
    "region"       VARCHAR(120) NOT NULL,
    "region_key"   VARCHAR(140) NOT NULL,
    "note"         VARCHAR(500),
    "issued_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),
    "updated_at"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "member_cards_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "member_cards_card_number_key" ON "member_cards" ("card_number");
CREATE UNIQUE INDEX "member_cards_card_uid_key"    ON "member_cards" ("card_uid");
CREATE UNIQUE INDEX "member_cards_holder_id_key"   ON "member_cards" ("holder_id");
CREATE INDEX "member_cards_region_key_idx"   ON "member_cards" ("region_key");
CREATE INDEX "member_cards_issued_by_id_idx" ON "member_cards" ("issued_by_id");
CREATE INDEX "member_cards_status_idx"       ON "member_cards" ("status");

ALTER TABLE "member_cards"
    ADD CONSTRAINT "member_cards_holder_id_fkey"
    FOREIGN KEY ("holder_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "member_cards"
    ADD CONSTRAINT "member_cards_issued_by_id_fkey"
    FOREIGN KEY ("issued_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
