import { z } from 'zod';

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
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET minimal 32 karakter')
    .default('dev_only_secret_change_me_in_real_environments_please'),
  JWT_EXPIRES_IN: z.string().default('7d'),
});

export type AppConfig = z.infer<typeof envSchema>;

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
  return parsed.data;
}
