-- =====================================================================
-- BinGo — Bukti timbang digital (e-receipt) dan taksonomi grade material
--
-- Menambahkan:
--   1) enum "MaterialGrade" — grade sebagaimana dipakai titik penerima,
--      lebih halus daripada "MaterialType" yang menggolongkan per polimer.
--   2) tabel "weighing_receipts" — header bukti timbang.
--   3) tabel "weighing_receipt_lines" — rincian per grade, dengan potongan
--      berat dan potongan rupiah sebagai kolom terpisah.
-- =====================================================================

-- 1) Enum ---------------------------------------------------------------
CREATE TYPE "MaterialGrade" AS ENUM (
    'PET_BOTOL_BENING',
    'PET_BOTOL_WARNA',
    'PP_GELAS_BENING',
    'PP_GELAS_WARNA',
    'PP_PLASTIK_PUTIH',
    'LDPE_KRESEK',
    'PLASTIK_CAMPUR',
    'KERTAS_KORAN',
    'KERTAS_ARSIP',
    'KERTAS_KARDUS',
    'KERTAS_DUPLEX',
    'LOGAM_ALUMINIUM',
    'LOGAM_TEMBAGA',
    'LOGAM_BESI',
    'LOGAM_KALENG',
    'KACA_BELING',
    'MINYAK_JELANTAH',
    'MULTILAYER_SACHET'
);

-- 2) Tabel: weighing_receipts -------------------------------------------
CREATE TABLE "weighing_receipts" (
    "id" TEXT NOT NULL,
    "receipt_no" VARCHAR(24) NOT NULL,
    "pickup_request_id" TEXT,
    "seller_id" TEXT NOT NULL,
    "issued_by_id" TEXT NOT NULL,
    "partner_name" VARCHAR(160) NOT NULL,
    "scale_tera_no" VARCHAR(64),
    "region" VARCHAR(120) NOT NULL,
    "notes" TEXT,
    "total_weight_kg" DECIMAL(10,2) NOT NULL,
    "total_deduction_kg" DECIMAL(10,2) NOT NULL,
    "total_gross_amount" INTEGER NOT NULL,
    "total_deduction_amount" INTEGER NOT NULL,
    "total_net_amount" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "weighing_receipts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "weighing_receipts_receipt_no_key"
    ON "weighing_receipts"("receipt_no");

-- Satu permintaan penjemputan hanya boleh punya satu bukti timbang.
CREATE UNIQUE INDEX "weighing_receipts_pickup_request_id_key"
    ON "weighing_receipts"("pickup_request_id");

CREATE INDEX "weighing_receipts_seller_id_idx" ON "weighing_receipts"("seller_id");
CREATE INDEX "weighing_receipts_issued_by_id_idx" ON "weighing_receipts"("issued_by_id");
CREATE INDEX "weighing_receipts_region_idx" ON "weighing_receipts"("region");
CREATE INDEX "weighing_receipts_created_at_idx" ON "weighing_receipts"("created_at");

-- 3) Tabel: weighing_receipt_lines --------------------------------------
CREATE TABLE "weighing_receipt_lines" (
    "id" TEXT NOT NULL,
    "receipt_id" TEXT NOT NULL,
    "grade" "MaterialGrade" NOT NULL,
    "weight_kg" DECIMAL(8,2) NOT NULL,
    "deduction_kg" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "deduction_reason" VARCHAR(160),
    "price_per_kg" INTEGER NOT NULL,
    "deduction_amount" INTEGER NOT NULL DEFAULT 0,
    "gross_amount" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,
    CONSTRAINT "weighing_receipt_lines_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "weighing_receipt_lines_receipt_id_idx"
    ON "weighing_receipt_lines"("receipt_id");

-- Papan harga mengelompokkan menurut grade, jadi indeks ini dipakai langsung
-- oleh kueri persentil.
CREATE INDEX "weighing_receipt_lines_grade_idx"
    ON "weighing_receipt_lines"("grade");

-- 4) Foreign key --------------------------------------------------------
ALTER TABLE "weighing_receipts"
    ADD CONSTRAINT "weighing_receipts_seller_id_fkey"
    FOREIGN KEY ("seller_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "weighing_receipts"
    ADD CONSTRAINT "weighing_receipts_issued_by_id_fkey"
    FOREIGN KEY ("issued_by_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "weighing_receipts"
    ADD CONSTRAINT "weighing_receipts_pickup_request_id_fkey"
    FOREIGN KEY ("pickup_request_id") REFERENCES "pickup_requests"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "weighing_receipt_lines"
    ADD CONSTRAINT "weighing_receipt_lines_receipt_id_fkey"
    FOREIGN KEY ("receipt_id") REFERENCES "weighing_receipts"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 5) Batasan nilai ------------------------------------------------------
-- Berat dan harga tidak boleh negatif, dan potongan berat tidak boleh
-- melebihi berat kotor. Ini ditegakkan di basis data, bukan hanya di DTO,
-- supaya bukti timbang tidak bisa dibuat tidak masuk akal lewat jalur mana pun.
ALTER TABLE "weighing_receipt_lines"
    ADD CONSTRAINT "weighing_receipt_lines_weight_positive"
    CHECK ("weight_kg" > 0);

ALTER TABLE "weighing_receipt_lines"
    ADD CONSTRAINT "weighing_receipt_lines_deduction_kg_valid"
    CHECK ("deduction_kg" >= 0 AND "deduction_kg" <= "weight_kg");

ALTER TABLE "weighing_receipt_lines"
    ADD CONSTRAINT "weighing_receipt_lines_price_nonnegative"
    CHECK ("price_per_kg" >= 0);

ALTER TABLE "weighing_receipt_lines"
    ADD CONSTRAINT "weighing_receipt_lines_deduction_amount_nonnegative"
    CHECK ("deduction_amount" >= 0);
