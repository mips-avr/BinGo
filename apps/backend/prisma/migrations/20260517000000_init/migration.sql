-- =====================================================================
-- BinGo — Migrasi awal (Phase 1)
-- Membuat ekstensi PostGIS, seluruh enum, tabel inti, dan trigger
-- sinkronisasi kolom geospasial `location` dari pasangan (lat,lng).
-- =====================================================================

-- 1) Ekstensi PostGIS ---------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "postgis_topology";

-- 2) Enum types ---------------------------------------------------------
CREATE TYPE "UserRole" AS ENUM ('CITIZEN', 'WASTE_AGENT', 'MSME');

CREATE TYPE "PickupStatus" AS ENUM (
    'PENDING',
    'ACCEPTED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);

CREATE TYPE "ReportStatus" AS ENUM ('DILAPORKAN', 'DIVERIFIKASI', 'SELESAI');

CREATE TYPE "TransactionStatus" AS ENUM (
    'PENDING',
    'PAID',
    'SHIPPED',
    'COMPLETED',
    'CANCELLED'
);

CREATE TYPE "MaterialType" AS ENUM (
    'PET',
    'HDPE',
    'PVC',
    'LDPE',
    'PP',
    'PS',
    'OTHER_PLASTIC',
    'PAPER',
    'METAL',
    'GLASS',
    'ORGANIC',
    'MIXED'
);

-- 3) Tabel: users -------------------------------------------------------
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nik" VARCHAR(16),
    "name" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "role" "UserRole" NOT NULL,
    "password_hash" TEXT NOT NULL,
    "points_balance" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_nik_key" ON "users" ("nik");
CREATE UNIQUE INDEX "users_phone_key" ON "users" ("phone");
CREATE INDEX "users_role_idx" ON "users" ("role");

-- 4) Tabel: pickup_requests --------------------------------------------
CREATE TABLE "pickup_requests" (
    "id" TEXT NOT NULL,
    "citizen_id" TEXT NOT NULL,
    "agent_id" TEXT,
    "status" "PickupStatus" NOT NULL DEFAULT 'PENDING',
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "location" geometry(Point, 4326),
    "address" VARCHAR(255) NOT NULL,
    "material_type" "MaterialType" NOT NULL,
    "estimated_weight_kg" DECIMAL(6, 2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pickup_requests_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "pickup_requests_citizen_id_fkey"
        FOREIGN KEY ("citizen_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pickup_requests_agent_id_fkey"
        FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pickup_requests_lat_range_chk" CHECK ("lat" BETWEEN -90 AND 90),
    CONSTRAINT "pickup_requests_lng_range_chk" CHECK ("lng" BETWEEN -180 AND 180),
    CONSTRAINT "pickup_requests_weight_chk" CHECK ("estimated_weight_kg" > 0)
);

CREATE INDEX "pickup_requests_status_idx" ON "pickup_requests" ("status");
CREATE INDEX "pickup_requests_citizen_id_idx" ON "pickup_requests" ("citizen_id");
CREATE INDEX "pickup_requests_agent_id_idx" ON "pickup_requests" ("agent_id");
-- GIST index untuk query ST_DWithin / ST_Distance.
CREATE INDEX "pickup_requests_location_gist" ON "pickup_requests" USING GIST ("location");

-- 5) Tabel: reports ----------------------------------------------------
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "citizen_id" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'DILAPORKAN',
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "location" geometry(Point, 4326),
    "description" TEXT,
    "image_url" VARCHAR(512) NOT NULL,
    "verification_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reports_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reports_citizen_id_fkey"
        FOREIGN KEY ("citizen_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reports_lat_range_chk" CHECK ("lat" BETWEEN -90 AND 90),
    CONSTRAINT "reports_lng_range_chk" CHECK ("lng" BETWEEN -180 AND 180)
);

CREATE INDEX "reports_status_idx" ON "reports" ("status");
CREATE INDEX "reports_citizen_id_idx" ON "reports" ("citizen_id");
CREATE INDEX "reports_location_gist" ON "reports" USING GIST ("location");

-- 6) Tabel: marketplace_items ------------------------------------------
CREATE TABLE "marketplace_items" (
    "id" TEXT NOT NULL,
    "supplier_name" VARCHAR(160) NOT NULL,
    "item_name" VARCHAR(160) NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "min_order_qty" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "image_url" VARCHAR(512),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "marketplace_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "marketplace_items_price_chk" CHECK ("price" >= 0),
    CONSTRAINT "marketplace_items_min_order_chk" CHECK ("min_order_qty" >= 1),
    CONSTRAINT "marketplace_items_stock_chk" CHECK ("stock" >= 0)
);

CREATE INDEX "marketplace_items_supplier_name_idx" ON "marketplace_items" ("supplier_name");

-- 7) Tabel: transactions -----------------------------------------------
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "total_price" INTEGER NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "transactions_buyer_id_fkey"
        FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "transactions_item_id_fkey"
        FOREIGN KEY ("item_id") REFERENCES "marketplace_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transactions_qty_chk" CHECK ("qty" >= 1),
    CONSTRAINT "transactions_total_price_chk" CHECK ("total_price" >= 0)
);

CREATE INDEX "transactions_buyer_id_idx" ON "transactions" ("buyer_id");
CREATE INDEX "transactions_item_id_idx" ON "transactions" ("item_id");
CREATE INDEX "transactions_status_idx" ON "transactions" ("status");

-- 8) Trigger sinkronisasi lat/lng → location ----------------------------
-- Dengan trigger ini, service layer cukup menulis `lat` & `lng` lewat Prisma;
-- kolom `location` (geometry) terisi otomatis sehingga GIST index langsung
-- dapat digunakan oleh ST_DWithin / ST_Distance.
CREATE OR REPLACE FUNCTION bingo_sync_latlng_to_geom()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
        NEW.location := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
    ELSE
        NEW.location := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pickup_requests_sync_location
    BEFORE INSERT OR UPDATE OF lat, lng ON "pickup_requests"
    FOR EACH ROW EXECUTE FUNCTION bingo_sync_latlng_to_geom();

CREATE TRIGGER reports_sync_location
    BEFORE INSERT OR UPDATE OF lat, lng ON "reports"
    FOR EACH ROW EXECUTE FUNCTION bingo_sync_latlng_to_geom();
