-- =====================================================================
-- BinGo — Kunci wilayah papan harga, dukungan radar geospasial, dan
-- integritas verifikasi laporan.
--
-- Menambahkan:
--   1) fungsi bingo_normalize_region_key() — cerminan SQL dari
--      normalizeRegionKey() di @bingo/shared-types.
--   2) weighing_receipts.region_key + backfill + indeks papan harga.
--   3) weighing_receipts.walk_in — menandai setoran langsung yang tidak
--      dapat ditelusuri ke permintaan penjemputan.
--   4) tabel report_verifications — satu warga satu suara per laporan.
--   5) indeks marketplace_items(item_name).
--   6) indeks GIST ekspresi pada (location::geography) untuk pickup_requests
--      dan reports, menggantikan indeks lama yang tidak pernah terpakai.
-- =====================================================================

-- 1) Normalisasi wilayah -------------------------------------------------
-- Wilayah pada bukti timbang diketik manusia. Satu kecamatan yang sama
-- tercatat sebagai "Kecamatan Beji, Depok", "Kec. Beji, Depok", dan
-- "kelurahan beji kota depok". Bila papan harga mencocokkan teks mentah,
-- setiap ejaan menjadi wilayah tersendiri, tidak satu pun mencapai ambang
-- minimum data, dan papan harga tidak pernah terbentuk.
--
-- Fungsi ini harus menghasilkan nilai yang PERSIS SAMA dengan
-- normalizeRegionKey() di packages/shared-types/src/region.ts. Bila salah
-- satunya diubah, yang lain wajib ikut diubah — kalau tidak, backfill dan
-- jalur tulis akan menghasilkan kunci yang berbeda untuk wilayah yang sama.
CREATE OR REPLACE FUNCTION bingo_normalize_region_key(p_region TEXT)
RETURNS TEXT AS $$
    SELECT COALESCE(
        (
            SELECT string_agg(tok, ' ' ORDER BY ord)
            FROM unnest(
                string_to_array(
                    btrim(regexp_replace(lower(COALESCE(p_region, '')), '[^a-z0-9]+', ' ', 'g')),
                    ' '
                )
            ) WITH ORDINALITY AS t(tok, ord)
            WHERE tok <> ''
              -- Kata tingkat administrasi tidak membedakan wilayah, jadi
              -- dibuang. Bentuk bertitik ("Kec.") sudah kehilangan titiknya
              -- pada regexp_replace di atas, sehingga cukup bentuk polosnya.
              AND tok NOT IN (
                  'kecamatan', 'kec',
                  'kelurahan', 'kel',
                  'desa',
                  'kota',
                  'kabupaten', 'kab',
                  'provinsi'
              )
        ),
        ''
    );
$$ LANGUAGE sql IMMUTABLE;

-- 2) weighing_receipts.region_key ---------------------------------------
ALTER TABLE "weighing_receipts" ADD COLUMN "region_key" VARCHAR(140);

-- Backfill. Bila normalisasi menyisakan string kosong (mis. wilayah hanya
-- ditulis "Kecamatan"), jatuhkan ke bentuk huruf kecil yang dirapikan supaya
-- baris tetap punya identitas dan tidak menyatu dengan baris cacat lain.
UPDATE "weighing_receipts"
SET "region_key" = COALESCE(
    NULLIF(LEFT(bingo_normalize_region_key("region"), 140), ''),
    LEFT(btrim(lower("region")), 140)
);

ALTER TABLE "weighing_receipts" ALTER COLUMN "region_key" SET NOT NULL;

-- Indeks utama papan harga: satu wilayah, jendela waktu mundur dari sekarang.
-- Urutan menurun pada created_at membuat "7 hari terakhir" terbaca dari ujung
-- indeks tanpa memindai seluruh riwayat wilayah tersebut.
CREATE INDEX "weighing_receipts_region_key_created_at_idx"
    ON "weighing_receipts" ("region_key", "created_at" DESC);

-- 3) weighing_receipts.walk_in ------------------------------------------
-- Sebelum kolom ini ada, seorang pemulung dapat menerbitkan bukti timbang
-- atas nama seller_id mana pun tanpa satu pun kaitan ke serah terima nyata,
-- dan bukti itu ikut menyusun papan harga. Artinya papan harga — klaim
-- terkuat produk ini — dapat digerakkan oleh satu akun tanpa pernah menyentuh
-- material. Sekarang bukti wajib menunjuk permintaan penjemputan miliknya,
-- atau mengaku sebagai setoran langsung (walk-in) dan dikeluarkan dari papan.
ALTER TABLE "weighing_receipts"
    ADD COLUMN "walk_in" BOOLEAN NOT NULL DEFAULT false;

-- Baris lama tanpa kaitan penjemputan diperlakukan sebagai walk-in: itulah
-- klasifikasi yang jujur untuk data yang tidak dapat lagi ditelusuri.
UPDATE "weighing_receipts"
SET "walk_in" = true
WHERE "pickup_request_id" IS NULL;

-- Catatan: aturan "pickup_request_id ADA atau walk_in = true" sengaja TIDAK
-- dipasang sebagai CHECK constraint. Foreign key pickup_request_id memakai
-- ON DELETE SET NULL, sehingga penghapusan satu permintaan penjemputan dapat
-- membuat baris bukti timbang yang tadinya sah mendadak melanggar CHECK dan
-- menggagalkan penghapusan yang seharusnya legal. Aturan ditegakkan di
-- WeighingReceiptsService.create(), satu-satunya jalur penulisan bukti.

-- 4) Tabel: report_verifications ----------------------------------------
-- Tanpa tabel ini, reports.verification_count hanyalah penghitung yang dapat
-- dinaikkan berulang kali oleh orang yang sama. Satu akun cukup memanggil
-- endpoint verifikasi tiga kali untuk menaikkan laporan apa pun ke status
-- DIVERIFIKASI dan mencetak 50 poin bagi pelapor.
CREATE TABLE "report_verifications" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "report_verifications_pkey" PRIMARY KEY ("id")
);

-- Aturan "satu warga satu suara" ditegakkan basis data, bukan hanya kode,
-- supaya dua permintaan berbarengan tidak dapat menyelinap melewatinya.
CREATE UNIQUE INDEX "report_verifications_report_id_user_id_key"
    ON "report_verifications" ("report_id", "user_id");

CREATE INDEX "report_verifications_user_id_idx"
    ON "report_verifications" ("user_id");

ALTER TABLE "report_verifications"
    ADD CONSTRAINT "report_verifications_report_id_fkey"
    FOREIGN KEY ("report_id") REFERENCES "reports"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "report_verifications"
    ADD CONSTRAINT "report_verifications_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- reports.verification_count TIDAK dihitung ulang menjadi nol di sini.
-- Angka lama adalah warisan dari masa sebelum tabel ini ada dan tidak dapat
-- dipetakan ke warga tertentu; menolkannya akan menurunkan laporan yang sudah
-- DIVERIFIKASI. Sejak migrasi ini, setiap verifikasi baru menulis satu baris
-- di sini dan verification_count dihitung ulang dari jumlah barisnya.

-- 5) Indeks pencarian produk --------------------------------------------
-- Pencarian WasteMart menelusuri nama produk lebih sering daripada nama
-- pemasok, tetapi hanya supplier_name yang punya indeks.
CREATE INDEX "marketplace_items_item_name_idx"
    ON "marketplace_items" ("item_name");

-- 6) Indeks GIST untuk kueri radius -------------------------------------
-- Migrasi 20260517153739_mvp_1 menghapus pickup_requests_location_gist dan
-- reports_location_gist. Keduanya memang tidak berguna: indeks dibuat atas
-- kolom `location` bertipe geometry, sementara seluruh kueri memakai
-- `location::geography` agar jaraknya dalam meter di permukaan bumi. Operator
-- geography tidak dapat memakai indeks geometry, sehingga setiap ST_DWithin
-- berakhir sebagai pemindaian tabel penuh.
--
-- Indeks ekspresi berikut dibangun atas nilai yang benar-benar dipakai kueri,
-- sehingga ST_DWithin dan ST_Distance pada /nearby dan /radar dapat memakainya.
--
-- PERINGATAN untuk pengembang berikutnya: Prisma tidak dapat menyatakan indeks
-- ekspresi maupun indeks GIST di schema.prisma, sehingga `prisma migrate dev`
-- akan menganggap kedua indeks ini sebagai perbedaan yang harus dihapus dan
-- menuliskan DROP INDEX di migrasi berikutnya — persis yang terjadi pada
-- migrasi 20260517153739_mvp_1. Bila kelak melihat DROP INDEX untuk salah satu
-- nama di bawah pada migrasi yang dihasilkan otomatis, HAPUS baris DROP itu
-- dari migrasi tersebut sebelum di-commit. Tanpa indeks ini, setiap pemuatan
-- radar memindai seluruh tabel pickup_requests.
CREATE INDEX "pickup_requests_location_geog_gist"
    ON "pickup_requests" USING GIST (("location"::geography));

CREATE INDEX "reports_location_geog_gist"
    ON "reports" USING GIST (("location"::geography));
