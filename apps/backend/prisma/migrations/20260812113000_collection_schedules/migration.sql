CREATE TYPE "CollectionSchedulePublisherType" AS ENUM (
  'DLH',
  'SUDIN_LH',
  'KELURAHAN_RT_RW',
  'BANK_SAMPAH',
  'TPS3R',
  'OPERATOR'
);

CREATE TYPE "CollectionServiceMode" AS ENUM ('DOOR_TO_DOOR', 'COLLECTION_POINT');

CREATE TYPE "CollectionDay" AS ENUM (
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY'
);

CREATE TABLE "collection_schedules" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "title" VARCHAR(160) NOT NULL,
  "publisher_name" VARCHAR(180) NOT NULL,
  "publisher_type" "CollectionSchedulePublisherType" NOT NULL,
  "service_mode" "CollectionServiceMode" NOT NULL,
  "area" VARCHAR(220) NOT NULL,
  "region_key" VARCHAR(220) NOT NULL,
  "materials" "MaterialType"[] NOT NULL,
  "days" "CollectionDay"[] NOT NULL,
  "start_time" VARCHAR(5),
  "end_time" VARCHAR(5),
  "schedule_note" TEXT,
  "preparation_note" TEXT,
  "source_url" TEXT NOT NULL,
  "verified_at" TIMESTAMP(3) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "collection_schedules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "collection_schedules_source_url_key"
  ON "collection_schedules"("source_url");
CREATE INDEX "collection_schedules_region_key_active_idx"
  ON "collection_schedules"("region_key", "active");
CREATE INDEX "collection_schedules_publisher_type_idx"
  ON "collection_schedules"("publisher_type");
