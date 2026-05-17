/**
 * Setup variabel lingkungan untuk seluruh test e2e.
 * - Pakai DATABASE_URL dari shell bila ada (untuk CI), kalau tidak,
 *   fallback ke instance Postgres+PostGIS lokal via docker-compose.
 * - JWT_SECRET diberi nilai default agar Zod schema (>=32 char) lolos.
 */
import { config as loadDotEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const candidates = [
  resolve(__dirname, '../.env.test'),
  resolve(__dirname, '../.env'),
  resolve(__dirname, '../../../.env'),
];
for (const p of candidates) {
  if (existsSync(p)) {
    loadDotEnv({ path: p });
    break;
  }
}

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://bingo:bingo_dev_password@localhost:5432/bingo?schema=public';
process.env.JWT_SECRET =
  process.env.JWT_SECRET ?? 'test_secret_yang_panjangnya_minimal_32_karakter_ok';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h';
