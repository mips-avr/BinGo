import { validateConfiguration } from '../configuration';

const baseConfig = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://bingo:secret@database.example/bingo',
  JWT_SECRET: 'a-production-secret-that-is-longer-than-thirty-two-characters',
};

describe('validateConfiguration untuk Vercel', () => {
  it('menolak filesystem sementara tanpa Blob store', () => {
    expect(() => validateConfiguration({ ...baseConfig, VERCEL: '1' })).toThrow(
      'BLOB_READ_WRITE_TOKEN: wajib pada Vercel',
    );
  });

  it('menerima token Blob dan mengabaikan string kosong pada development', () => {
    expect(
      validateConfiguration({
        ...baseConfig,
        VERCEL: '1',
        BLOB_READ_WRITE_TOKEN: 'blob-token',
      }).BLOB_READ_WRITE_TOKEN,
    ).toBe('blob-token');

    expect(
      validateConfiguration({
        NODE_ENV: 'development',
        DATABASE_URL: baseConfig.DATABASE_URL,
        BLOB_READ_WRITE_TOKEN: '',
      }).BLOB_READ_WRITE_TOKEN,
    ).toBeUndefined();
  });
});
