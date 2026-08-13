CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'ARCHIVED');

ALTER TABLE "service_areas" ADD COLUMN "archived_at" TIMESTAMP(3), ADD COLUMN "archived_by" TEXT, ADD COLUMN "archive_reason" TEXT;
ALTER TABLE "households" ADD COLUMN "archived_at" TIMESTAMP(3), ADD COLUMN "archived_by" TEXT, ADD COLUMN "archive_reason" TEXT;
ALTER TABLE "service_plans" ADD COLUMN "archived_at" TIMESTAMP(3), ADD COLUMN "archived_by" TEXT, ADD COLUMN "archive_reason" TEXT;
ALTER TABLE "collectors" ADD COLUMN "archived_at" TIMESTAMP(3), ADD COLUMN "archived_by" TEXT, ADD COLUMN "archive_reason" TEXT;
ALTER TABLE "collection_vehicles" ADD COLUMN "archived_at" TIMESTAMP(3), ADD COLUMN "archived_by" TEXT, ADD COLUMN "archive_reason" TEXT;
ALTER TABLE "collection_calendars" ADD COLUMN "archived_at" TIMESTAMP(3), ADD COLUMN "archived_by" TEXT, ADD COLUMN "archive_reason" TEXT;
ALTER TABLE "collection_routes" ADD COLUMN "archived_at" TIMESTAMP(3), ADD COLUMN "archived_by" TEXT, ADD COLUMN "archive_reason" TEXT;
ALTER TABLE "weigh_stations" ADD COLUMN "archived_at" TIMESTAMP(3), ADD COLUMN "archived_by" TEXT, ADD COLUMN "archive_reason" TEXT;
ALTER TABLE "business_requirements" ADD COLUMN "archived_at" TIMESTAMP(3), ADD COLUMN "archived_by" TEXT, ADD COLUMN "archive_reason" TEXT;
ALTER TABLE "material_lots" ADD COLUMN "archived_at" TIMESTAMP(3), ADD COLUMN "archived_by" TEXT, ADD COLUMN "archive_reason" TEXT;
ALTER TABLE "facilities" ADD COLUMN "archived_at" TIMESTAMP(3), ADD COLUMN "archived_by" TEXT, ADD COLUMN "archive_reason" TEXT, ADD COLUMN "verification_requested_at" TIMESTAMP(3), ADD COLUMN "verification_requested_by" TEXT;

CREATE TABLE "material_category_metadata" (
  "code" "MaterialType" NOT NULL,
  "public_name" VARCHAR(100) NOT NULL,
  "description" TEXT NOT NULL,
  "preparation" TEXT,
  "icon" VARCHAR(50),
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "archived_at" TIMESTAMP(3),
  "archived_by" TEXT,
  "archive_reason" TEXT,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "material_category_metadata_pkey" PRIMARY KEY ("code")
);

CREATE TABLE "support_tickets" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT,
  "created_by_id" TEXT NOT NULL,
  "assigned_to_id" TEXT,
  "subject" VARCHAR(180) NOT NULL,
  "description" TEXT NOT NULL,
  "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_ticket_messages" (
  "id" TEXT NOT NULL,
  "ticket_id" TEXT NOT NULL,
  "author_id" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "support_ticket_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "support_tickets_status_updated_at_idx" ON "support_tickets"("status", "updated_at");
CREATE INDEX "support_ticket_messages_ticket_id_created_at_idx" ON "support_ticket_messages"("ticket_id", "created_at");
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
