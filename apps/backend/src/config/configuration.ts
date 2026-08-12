import { Logger } from '@nestjs/common';
import { z } from 'zod';

const optionalNonEmptyString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().min(1).optional(),
);

/**
 * Secret bawaan untuk pengembangan lokal saja.
 *
 * Nilai ini ada di repositori publik, jadi siapa pun yang membacanya dapat
 * menandatangani token JWT yang sah untuk pengguna mana pun dengan peran mana
 * pun. Di production, aplikasi menolak boot bila secret ini yang dipakai —
 * lihat `resolveJwtSecret`. Nilai bawaannya tetap disimpan di sini supaya
 * `pnpm backend:dev` dan test tidak menuntut penyiapan env lebih dahulu.
 */
export const DEV_ONLY_JWT_SECRET = 'dev_only_secret_change_me_in_real_environments_please';

/**
 * Schema validasi variabel lingkungan menggunakan Zod.
 * Aplikasi akan menolak boot bila konfigurasi tidak valid.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  BACKEND_PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL wajib diisi')
    .refine((v) => v.startsWith('postgresql://') || v.startsWith('postgres://'), {
      message: 'DATABASE_URL harus berupa connection string PostgreSQL',
    }),
  // Sengaja opsional di schema. Kewajibannya bergantung pada NODE_ENV dan
  // ditegakkan di `resolveJwtSecret` supaya pesan galatnya dapat menjelaskan
  // sebabnya, bukan sekadar "wajib diisi".
  JWT_SECRET: z.string().min(32, 'JWT_SECRET minimal 32 karakter').optional(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  PUBLIC_BASE_URL: z.string().url('PUBLIC_BASE_URL harus berupa URL yang valid').optional(),
  BLOB_READ_WRITE_TOKEN: optionalNonEmptyString,
  VERCEL: z.string().optional(),
});

export type AppConfig = z.infer<typeof envSchema> & { JWT_SECRET: string };

/**
 * Memvalidasi konfigurasi. Dipanggil oleh `ConfigModule.forRoot({ validate })`
 * yang mengirimkan hasil merge antara `process.env` dan file `.env` yang
 * sudah ter-load. Jangan baca `process.env` secara langsung di sini.
 */
export function validateConfiguration(rawConfig: Record<string, unknown>): AppConfig {
  const parsed = envSchema.safeParse(rawConfig);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => ` - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Konfigurasi tidak valid:\n${issues}`);
  }

  if (parsed.data.VERCEL && !parsed.data.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      'Konfigurasi tidak valid:\n' +
        ' - BLOB_READ_WRITE_TOKEN: wajib pada Vercel karena filesystem Function tidak permanen.',
    );
  }

  return {
    ...parsed.data,
    JWT_SECRET: resolveJwtSecret(parsed.data.NODE_ENV, parsed.data.JWT_SECRET),
  };
}

/**
 * Menentukan JWT_SECRET yang dipakai, dan menolak boot bila production
 * berjalan tanpa secret miliknya sendiri.
 *
 * Secret JWT adalah satu-satunya hal yang membedakan token asli dari token
 * buatan siapa pun. Bila production memakai nilai bawaan yang tertulis di
 * repositori, seluruh autentikasi aplikasi ini setara dengan tidak ada:
 * seseorang cukup menandatangani token berisi `role: WASTE_AGENT` dan `sub`
 * milik orang lain. Karena itu kegagalannya harus berisik dan terjadi saat
 * boot, bukan diam-diam berjalan sampai ada yang menyadarinya.
 */
function resolveJwtSecret(nodeEnv: string, provided: string | undefined): string {
  const isProduction = nodeEnv === 'production';

  if (isProduction) {
    if (!provided) {
      throw new Error(
        'Konfigurasi tidak valid:\n' +
          ' - JWT_SECRET: wajib diisi saat NODE_ENV=production. ' +
          'Isi dengan nilai acak minimal 32 karakter, mis. `openssl rand -base64 48`.',
      );
    }
    if (provided === DEV_ONLY_JWT_SECRET) {
      throw new Error(
        'Konfigurasi tidak valid:\n' +
          ' - JWT_SECRET: masih memakai secret bawaan pengembangan, yang nilainya ' +
          'tertulis di dalam repositori. Siapa pun yang membacanya dapat menerbitkan ' +
          'token yang sah untuk akun mana pun. Ganti dengan nilai acak minimal ' +
          '32 karakter sebelum menjalankan production.',
      );
    }
    return provided;
  }

  if (!provided) {
    new Logger('Configuration').warn(
      '================================================================\n' +
        ' JWT_SECRET tidak diatur. Memakai secret bawaan pengembangan.\n' +
        ' Nilai ini ada di dalam repositori, jadi token yang diterbitkan\n' +
        ' server ini DAPAT DIPALSUKAN siapa pun. Jangan pernah memakai\n' +
        ' konfigurasi ini di luar mesin pengembangan Anda sendiri.\n' +
        '================================================================',
    );
    return DEV_ONLY_JWT_SECRET;
  }

  return provided;
}
