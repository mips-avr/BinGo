-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('MANAGER', 'BUSINESS');

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'CHANGES_REQUESTED', 'ACTIVE', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "OrganizationReviewDecision" AS ENUM ('SUBMITTED', 'APPROVED', 'CHANGES_REQUESTED', 'REJECTED', 'SUSPENDED', 'REACTIVATED');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('MANAGER_ADMIN', 'MANAGER_OPERATOR', 'COLLECTOR', 'HOUSEHOLD', 'BUSINESS_BUYER');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('UNPAID', 'PAID', 'VOID');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('SUCCEEDED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ServiceAreaStatus" AS ENUM ('ACTIVE', 'COLLECTING_INTEREST', 'INACTIVE');

-- CreateEnum
CREATE TYPE "RouteRunStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RouteStopStatus" AS ENUM ('PENDING', 'ARRIVED', 'COLLECTED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "WeightDirection" AS ENUM ('IN', 'SORTED_OUTPUT', 'RESIDUE', 'CORRECTION');

-- CreateEnum
CREATE TYPE "WeightSource" AS ENUM ('MANUAL', 'SIMULATOR');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('OPEN', 'BALANCED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LedgerDirection" AS ENUM ('CREDIT', 'DEBIT', 'RESERVE', 'RELEASE');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'HIDDEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('RESERVED', 'CONFIRMED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FacilityStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "WasteReportStatus" AS ENUM ('SUBMITTED', 'VERIFIED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


-- AlterTable
ALTER TABLE "collection_schedules" DROP CONSTRAINT "collection_schedules_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "collection_schedules_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "platform_roles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PLATFORM_ADMIN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "type" "OrganizationType" NOT NULL,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'DRAFT',
    "contact_name" VARCHAR(120),
    "contact_phone" VARCHAR(20),
    "address" VARCHAR(255),
    "suspension_reason" TEXT,
    "suspended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_applications" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "applicant_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'DRAFT',
    "organization_name" VARCHAR(180) NOT NULL,
    "organization_type" "OrganizationType" NOT NULL,
    "responsible_name" VARCHAR(120) NOT NULL,
    "contact_phone" VARCHAR(20) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "service_regions" TEXT[],
    "authority_basis" TEXT,
    "managed_facilities" TEXT[],
    "accepted_materials" "MaterialType"[],
    "capacity_note" TEXT,
    "receiving_schedule" TEXT,
    "quality_notes" TEXT,
    "declaration_accepted" BOOLEAN NOT NULL DEFAULT false,
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_documents" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "demo" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_review_events" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "reviewer_id" TEXT,
    "version" INTEGER NOT NULL,
    "decision" "OrganizationReviewDecision" NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_review_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_areas" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "region" VARCHAR(180) NOT NULL,
    "status" "ServiceAreaStatus" NOT NULL DEFAULT 'ACTIVE',
    "density_label" VARCHAR(80),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "households" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "service_area_id" TEXT NOT NULL,
    "user_id" TEXT,
    "account_no" VARCHAR(32) NOT NULL,
    "display_address" VARCHAR(255) NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "households_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_plans" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "service_area_id" TEXT,
    "name" VARCHAR(120) NOT NULL,
    "monthly_fee" INTEGER NOT NULL,
    "collection_days" "CollectionDay"[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "service_plan_id" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "period" VARCHAR(7) NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'UNPAID',
    "due_at" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_events" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "idempotency_key" VARCHAR(100) NOT NULL,
    "provider" VARCHAR(32) NOT NULL DEFAULT 'MOCK',
    "method" VARCHAR(50) NOT NULL,
    "amount" INTEGER NOT NULL,
    "reference" VARCHAR(80) NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collectors" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "employee_no" VARCHAR(40) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "hired_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collector_cards" (
    "id" TEXT NOT NULL,
    "collector_id" TEXT NOT NULL,
    "card_number" VARCHAR(32) NOT NULL,
    "uid_hash" VARCHAR(128),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collector_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_tap_events" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "device_event_id" VARCHAR(100) NOT NULL,
    "source" VARCHAR(32) NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_tap_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_vehicles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "plate_number" VARCHAR(20),
    "capacity_kg" DECIMAL(10,2),
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "collection_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_calendars" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "service_area_id" TEXT NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "days" "CollectionDay"[],
    "start_time" VARCHAR(5),
    "end_time" VARCHAR(5),
    "materials" "MaterialType"[],
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "collection_calendars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_routes" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "service_area_id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_stops" (
    "id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "household_id" TEXT,
    "sequence" INTEGER NOT NULL,
    "label" VARCHAR(160) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "status" "RouteStopStatus" NOT NULL DEFAULT 'PENDING',
    "issue_note" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "route_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_runs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "vehicle_id" TEXT,
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "status" "RouteRunStatus" NOT NULL DEFAULT 'PLANNED',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_assignments" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "collector_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "route_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weigh_stations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" VARCHAR(140) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "weigh_stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scale_channels" (
    "id" TEXT NOT NULL,
    "station_id" TEXT NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "source" "WeightSource" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "scale_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intake_batches" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "run_id" TEXT,
    "station_id" TEXT NOT NULL,
    "batch_no" VARCHAR(40) NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'OPEN',
    "input_kg" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "output_kg" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tolerance_kg" DECIMAL(8,2) NOT NULL DEFAULT 1,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intake_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sorting_batches" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "intake_batch_id" TEXT NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'OPEN',
    "approved_at" TIMESTAMP(3),

    CONSTRAINT "sorting_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weight_events" (
    "id" TEXT NOT NULL,
    "intake_batch_id" TEXT NOT NULL,
    "sorting_batch_id" TEXT,
    "collector_id" TEXT,
    "scale_channel_id" TEXT,
    "device_event_id" VARCHAR(100) NOT NULL,
    "direction" "WeightDirection" NOT NULL,
    "source" "WeightSource" NOT NULL,
    "material" "MaterialType" NOT NULL,
    "weight_kg" DECIMAL(12,2) NOT NULL,
    "correction_of_id" TEXT,
    "note" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weight_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_inventory_ledger" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "material" "MaterialType" NOT NULL,
    "direction" "LedgerDirection" NOT NULL,
    "quantity_kg" DECIMAL(12,2) NOT NULL,
    "reference_type" VARCHAR(50) NOT NULL,
    "reference_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_inventory_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_requirements" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "material" "MaterialType" NOT NULL,
    "quantity_kg" DECIMAL(12,2) NOT NULL,
    "price_per_kg" INTEGER,
    "region" VARCHAR(180) NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "hidden_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_quality_specs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "requirement_id" TEXT,
    "material" "MaterialType" NOT NULL,
    "moisture_max_pct" DECIMAL(5,2),
    "contamination_max_pct" DECIMAL(5,2),
    "notes" TEXT,

    CONSTRAINT "material_quality_specs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offtake_agreements" (
    "id" TEXT NOT NULL,
    "supplier_org_id" TEXT NOT NULL,
    "buyer_org_id" TEXT NOT NULL,
    "requirement_id" TEXT,
    "material" "MaterialType" NOT NULL,
    "agreed_price_per_kg" INTEGER NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),

    CONSTRAINT "offtake_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_lots" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "quality_spec_id" TEXT,
    "code" VARCHAR(40) NOT NULL,
    "material" "MaterialType" NOT NULL,
    "quantity_kg" DECIMAL(12,2) NOT NULL,
    "available_kg" DECIMAL(12,2) NOT NULL,
    "price_per_kg" INTEGER NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "hidden_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "seller_org_id" TEXT NOT NULL,
    "buyer_org_id" TEXT NOT NULL,
    "lot_id" TEXT NOT NULL,
    "order_no" VARCHAR(40) NOT NULL,
    "quantity_kg" DECIMAL(12,2) NOT NULL,
    "price_per_kg" INTEGER NOT NULL,
    "total_amount" INTEGER NOT NULL,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'RESERVED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_receipts" (
    "id" TEXT NOT NULL,
    "purchase_order_id" TEXT NOT NULL,
    "received_kg" DECIMAL(12,2) NOT NULL,
    "residue_kg" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "note" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_settlements" (
    "id" TEXT NOT NULL,
    "purchase_order_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reference" VARCHAR(80) NOT NULL,
    "settled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "residue_transfers" (
    "id" TEXT NOT NULL,
    "material_receipt_id" TEXT NOT NULL,
    "quantity_kg" DECIMAL(12,2) NOT NULL,
    "destination" VARCHAR(180) NOT NULL,
    "transferred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "residue_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facilities" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "name" VARCHAR(180) NOT NULL,
    "operator_name" VARCHAR(180) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "status" "FacilityStatus" NOT NULL DEFAULT 'ACTIVE',
    "source_url" VARCHAR(500) NOT NULL,
    "verified_at" TIMESTAMP(3) NOT NULL,
    "opening_note" VARCHAR(255),
    "demo" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facility_material_rules" (
    "id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "material" "MaterialType" NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT true,
    "preparation" TEXT,
    "min_weight_kg" DECIMAL(8,2),

    CONSTRAINT "facility_material_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facility_verifications" (
    "id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "verified_by" TEXT,
    "source_url" VARCHAR(500) NOT NULL,
    "note" TEXT,
    "verified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "facility_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waste_reports" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "reporter_id" TEXT NOT NULL,
    "status" "WasteReportStatus" NOT NULL DEFAULT 'SUBMITTED',
    "description" TEXT NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "photo_key" VARCHAR(500),
    "resolution_note" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waste_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waste_report_events" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "status" "WasteReportStatus" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waste_report_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "organization_id" TEXT,
    "action" VARCHAR(100) NOT NULL,
    "resource_type" VARCHAR(80) NOT NULL,
    "resource_id" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_roles_user_id_role_key" ON "platform_roles"("user_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_type_status_idx" ON "organizations"("type", "status");

-- CreateIndex
CREATE INDEX "organization_members_user_id_active_idx" ON "organization_members"("user_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_organization_id_user_id_role_key" ON "organization_members"("organization_id", "user_id", "role");

-- CreateIndex
CREATE INDEX "organization_applications_status_submitted_at_idx" ON "organization_applications"("status", "submitted_at");

-- CreateIndex
CREATE INDEX "organization_applications_applicant_id_idx" ON "organization_applications"("applicant_id");

-- CreateIndex
CREATE INDEX "verification_documents_application_id_idx" ON "verification_documents"("application_id");

-- CreateIndex
CREATE INDEX "organization_review_events_application_id_created_at_idx" ON "organization_review_events"("application_id", "created_at");

-- CreateIndex
CREATE INDEX "service_areas_organization_id_status_idx" ON "service_areas"("organization_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "households_user_id_key" ON "households"("user_id");

-- CreateIndex
CREATE INDEX "households_service_area_id_active_idx" ON "households"("service_area_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "households_organization_id_account_no_key" ON "households"("organization_id", "account_no");

-- CreateIndex
CREATE INDEX "service_plans_organization_id_active_idx" ON "service_plans"("organization_id", "active");

-- CreateIndex
CREATE INDEX "subscriptions_organization_id_active_idx" ON "subscriptions"("organization_id", "active");

-- CreateIndex
CREATE INDEX "invoices_organization_id_status_idx" ON "invoices"("organization_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_subscription_id_period_key" ON "invoices"("subscription_id", "period");

-- CreateIndex
CREATE UNIQUE INDEX "payment_events_idempotency_key_key" ON "payment_events"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "payment_events_reference_key" ON "payment_events"("reference");

-- CreateIndex
CREATE INDEX "payment_events_invoice_id_occurred_at_idx" ON "payment_events"("invoice_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "collectors_user_id_key" ON "collectors"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "collectors_organization_id_employee_no_key" ON "collectors"("organization_id", "employee_no");

-- CreateIndex
CREATE UNIQUE INDEX "collector_cards_card_number_key" ON "collector_cards"("card_number");

-- CreateIndex
CREATE UNIQUE INDEX "collector_cards_uid_hash_key" ON "collector_cards"("uid_hash");

-- CreateIndex
CREATE INDEX "collector_cards_collector_id_active_idx" ON "collector_cards"("collector_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "card_tap_events_device_event_id_key" ON "card_tap_events"("device_event_id");

-- CreateIndex
CREATE INDEX "card_tap_events_organization_id_occurred_at_idx" ON "card_tap_events"("organization_id", "occurred_at");

-- CreateIndex
CREATE INDEX "collection_calendars_organization_id_active_idx" ON "collection_calendars"("organization_id", "active");

-- CreateIndex
CREATE INDEX "collection_routes_organization_id_active_idx" ON "collection_routes"("organization_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "route_stops_route_id_sequence_key" ON "route_stops"("route_id", "sequence");

-- CreateIndex
CREATE INDEX "collection_runs_organization_id_scheduled_for_idx" ON "collection_runs"("organization_id", "scheduled_for");

-- CreateIndex
CREATE UNIQUE INDEX "route_assignments_run_id_collector_id_key" ON "route_assignments"("run_id", "collector_id");

-- CreateIndex
CREATE UNIQUE INDEX "intake_batches_batch_no_key" ON "intake_batches"("batch_no");

-- CreateIndex
CREATE INDEX "intake_batches_organization_id_status_idx" ON "intake_batches"("organization_id", "status");

-- CreateIndex
CREATE INDEX "sorting_batches_intake_batch_id_idx" ON "sorting_batches"("intake_batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "weight_events_device_event_id_key" ON "weight_events"("device_event_id");

-- CreateIndex
CREATE INDEX "weight_events_intake_batch_id_occurred_at_idx" ON "weight_events"("intake_batch_id", "occurred_at");

-- CreateIndex
CREATE INDEX "material_inventory_ledger_organization_id_material_created__idx" ON "material_inventory_ledger"("organization_id", "material", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "material_inventory_ledger_reference_type_reference_id_direc_key" ON "material_inventory_ledger"("reference_type", "reference_id", "direction");

-- CreateIndex
CREATE INDEX "business_requirements_organization_id_status_idx" ON "business_requirements"("organization_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "material_lots_code_key" ON "material_lots"("code");

-- CreateIndex
CREATE INDEX "material_lots_organization_id_status_idx" ON "material_lots"("organization_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_order_no_key" ON "purchase_orders"("order_no");

-- CreateIndex
CREATE INDEX "purchase_orders_seller_org_id_status_idx" ON "purchase_orders"("seller_org_id", "status");

-- CreateIndex
CREATE INDEX "purchase_orders_buyer_org_id_status_idx" ON "purchase_orders"("buyer_org_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "material_receipts_purchase_order_id_key" ON "material_receipts"("purchase_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_settlements_purchase_order_id_key" ON "order_settlements"("purchase_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_settlements_reference_key" ON "order_settlements"("reference");

-- CreateIndex
CREATE INDEX "facilities_status_verified_at_idx" ON "facilities"("status", "verified_at");

-- CreateIndex
CREATE UNIQUE INDEX "facility_material_rules_facility_id_material_key" ON "facility_material_rules"("facility_id", "material");

-- CreateIndex
CREATE INDEX "facility_verifications_facility_id_verified_at_idx" ON "facility_verifications"("facility_id", "verified_at");

-- CreateIndex
CREATE INDEX "waste_reports_organization_id_status_idx" ON "waste_reports"("organization_id", "status");

-- CreateIndex
CREATE INDEX "waste_report_events_report_id_created_at_idx" ON "waste_report_events"("report_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_events_created_at_idx" ON "audit_events"("created_at");

-- CreateIndex
CREATE INDEX "audit_events_organization_id_created_at_idx" ON "audit_events"("organization_id", "created_at");

-- AddForeignKey
ALTER TABLE "platform_roles" ADD CONSTRAINT "platform_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_applications" ADD CONSTRAINT "organization_applications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_applications" ADD CONSTRAINT "organization_applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "organization_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_review_events" ADD CONSTRAINT "organization_review_events_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "organization_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_review_events" ADD CONSTRAINT "organization_review_events_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_areas" ADD CONSTRAINT "service_areas_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "households" ADD CONSTRAINT "households_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "households" ADD CONSTRAINT "households_service_area_id_fkey" FOREIGN KEY ("service_area_id") REFERENCES "service_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "households" ADD CONSTRAINT "households_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_plans" ADD CONSTRAINT "service_plans_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_plans" ADD CONSTRAINT "service_plans_service_area_id_fkey" FOREIGN KEY ("service_area_id") REFERENCES "service_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_service_plan_id_fkey" FOREIGN KEY ("service_plan_id") REFERENCES "service_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collectors" ADD CONSTRAINT "collectors_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collectors" ADD CONSTRAINT "collectors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collector_cards" ADD CONSTRAINT "collector_cards_collector_id_fkey" FOREIGN KEY ("collector_id") REFERENCES "collectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_tap_events" ADD CONSTRAINT "card_tap_events_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "collector_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_tap_events" ADD CONSTRAINT "card_tap_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_vehicles" ADD CONSTRAINT "collection_vehicles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_calendars" ADD CONSTRAINT "collection_calendars_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_calendars" ADD CONSTRAINT "collection_calendars_service_area_id_fkey" FOREIGN KEY ("service_area_id") REFERENCES "service_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_routes" ADD CONSTRAINT "collection_routes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_routes" ADD CONSTRAINT "collection_routes_service_area_id_fkey" FOREIGN KEY ("service_area_id") REFERENCES "service_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "collection_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_runs" ADD CONSTRAINT "collection_runs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_runs" ADD CONSTRAINT "collection_runs_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "collection_routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_runs" ADD CONSTRAINT "collection_runs_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "collection_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_assignments" ADD CONSTRAINT "route_assignments_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "collection_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_assignments" ADD CONSTRAINT "route_assignments_collector_id_fkey" FOREIGN KEY ("collector_id") REFERENCES "collectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_assignments" ADD CONSTRAINT "route_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weigh_stations" ADD CONSTRAINT "weigh_stations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scale_channels" ADD CONSTRAINT "scale_channels_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "weigh_stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_batches" ADD CONSTRAINT "intake_batches_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_batches" ADD CONSTRAINT "intake_batches_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "collection_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_batches" ADD CONSTRAINT "intake_batches_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "weigh_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sorting_batches" ADD CONSTRAINT "sorting_batches_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sorting_batches" ADD CONSTRAINT "sorting_batches_intake_batch_id_fkey" FOREIGN KEY ("intake_batch_id") REFERENCES "intake_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_events" ADD CONSTRAINT "weight_events_intake_batch_id_fkey" FOREIGN KEY ("intake_batch_id") REFERENCES "intake_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_events" ADD CONSTRAINT "weight_events_sorting_batch_id_fkey" FOREIGN KEY ("sorting_batch_id") REFERENCES "sorting_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_events" ADD CONSTRAINT "weight_events_collector_id_fkey" FOREIGN KEY ("collector_id") REFERENCES "collectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_events" ADD CONSTRAINT "weight_events_scale_channel_id_fkey" FOREIGN KEY ("scale_channel_id") REFERENCES "scale_channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_inventory_ledger" ADD CONSTRAINT "material_inventory_ledger_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_requirements" ADD CONSTRAINT "business_requirements_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_quality_specs" ADD CONSTRAINT "material_quality_specs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_quality_specs" ADD CONSTRAINT "material_quality_specs_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "business_requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offtake_agreements" ADD CONSTRAINT "offtake_agreements_supplier_org_id_fkey" FOREIGN KEY ("supplier_org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offtake_agreements" ADD CONSTRAINT "offtake_agreements_buyer_org_id_fkey" FOREIGN KEY ("buyer_org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offtake_agreements" ADD CONSTRAINT "offtake_agreements_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "business_requirements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_lots" ADD CONSTRAINT "material_lots_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_lots" ADD CONSTRAINT "material_lots_quality_spec_id_fkey" FOREIGN KEY ("quality_spec_id") REFERENCES "material_quality_specs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_seller_org_id_fkey" FOREIGN KEY ("seller_org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_buyer_org_id_fkey" FOREIGN KEY ("buyer_org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "material_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_receipts" ADD CONSTRAINT "material_receipts_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_settlements" ADD CONSTRAINT "order_settlements_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residue_transfers" ADD CONSTRAINT "residue_transfers_material_receipt_id_fkey" FOREIGN KEY ("material_receipt_id") REFERENCES "material_receipts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facilities" ADD CONSTRAINT "facilities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facility_material_rules" ADD CONSTRAINT "facility_material_rules_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facility_verifications" ADD CONSTRAINT "facility_verifications_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waste_reports" ADD CONSTRAINT "waste_reports_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waste_reports" ADD CONSTRAINT "waste_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waste_report_events" ADD CONSTRAINT "waste_report_events_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "waste_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waste_report_events" ADD CONSTRAINT "waste_report_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
