#!/usr/bin/env bash
# Reset database lokal (hapus volume + migrate ulang).
# Pemakaian: ./infra/scripts/reset-db.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$ROOT_DIR"

echo "==> Menurunkan container & menghapus volume database..."
docker compose down -v

echo "==> Menjalankan ulang Postgres + PostGIS..."
docker compose up -d postgres

echo "==> Menunggu Postgres siap..."
until docker compose exec -T postgres pg_isready -U "${POSTGRES_USER:-bingo}" >/dev/null 2>&1; do
  sleep 1
done

echo "==> Menjalankan migrasi Prisma..."
pnpm --filter @bingo/backend prisma:migrate:deploy

echo "==> Selesai. Database siap dipakai."
