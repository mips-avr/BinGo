import { INestApplication } from '@nestjs/common';
import { existsSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { UPLOADS_DIR } from '../src/modules/uploads/uploads.constants';
import { bootstrapTestApp } from './helpers/bootstrap-app';

/**
 * 1x1 PNG transparan (smallest valid PNG). Cukup untuk membuktikan pipeline
 * multer → simpan ke disk → response URL bekerja tanpa membawa fixture biner.
 */
const PNG_1PX = Buffer.from(
  '89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000A4944415478DA63000100000005000128B61C0E0000000049454E44AE426082',
  'hex',
);

describe('Uploads e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const phone = `+62812${Date.now().toString().slice(-7)}99`;
  let token = '';
  const createdFiles: string[] = [];

  beforeAll(async () => {
    app = await bootstrapTestApp();
    prisma = app.get(PrismaService);
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ name: 'Pengunggah', phone, password: 'rahasiaSekali123', role: 'CITIZEN' })
      .expect(201);
    token = res.body.token.accessToken;
  });

  afterAll(async () => {
    for (const filename of createdFiles) {
      const p = resolve(UPLOADS_DIR, filename);
      if (existsSync(p)) unlinkSync(p);
    }
    await prisma.user.deleteMany({ where: { phone } });
    await app.close();
  });

  it('menolak tanpa Bearer token', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/uploads/image')
      .attach('file', PNG_1PX, { filename: 'a.png', contentType: 'image/png' })
      .expect(401);
  });

  it('menolak MIME bukan gambar (pdf)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/uploads/image')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('%PDF-1.4'), {
        filename: 'a.pdf',
        contentType: 'application/pdf',
      })
      .expect(400);
    expect(res.body.message).toMatch(/Hanya gambar/);
  });

  it('mengunggah PNG dan mengembalikan URL publik', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/uploads/image')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', PNG_1PX, { filename: 'sample.png', contentType: 'image/png' })
      .expect(201);
    expect(res.body.url).toMatch(/\/uploads\/.+\.png$/);
    expect(res.body.mimeType).toBe('image/png');
    expect(res.body.size).toBeGreaterThan(0);
    createdFiles.push(res.body.filename);

    // File dapat diunduh kembali via static serve.
    await request(app.getHttpServer()).get(`/uploads/${res.body.filename}`).expect(200);
  });
});
