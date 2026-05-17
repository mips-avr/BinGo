import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Direktori penyimpanan upload. Dapat di-override via env `UPLOADS_DIR`
 * (mis. di production gunakan volume mount atau bucket gateway).
 */
export const UPLOADS_DIR = resolve(
  process.env.UPLOADS_DIR ?? resolve(process.cwd(), 'uploads'),
);

if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}
