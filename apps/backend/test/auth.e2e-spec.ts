import { INestApplication, RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

/**
 * E2E test alur autentikasi penuh:
 * Register -> Login -> GET /auth/me dengan JWT.
 * Membutuhkan Postgres+PostGIS hidup di localhost:5432 (lihat docker-compose).
 */
describe('Auth flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const testPhone = `+62812${Date.now().toString().slice(-9)}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api', {
      exclude: [{ path: 'health', method: RequestMethod.GET }],
    });
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
      prefix: 'v',
    });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { phone: testPhone } });
    await app.close();
  });

  let accessToken = '';

  it('POST /api/v1/auth/register membuat akun & mengembalikan token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Warga Uji E2E',
        phone: testPhone,
        password: 'rahasiaSekali123',
        role: 'CITIZEN',
      })
      .expect(201);

    expect(res.body.user.phone).toBe(testPhone);
    expect(res.body.user.role).toBe('CITIZEN');
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(typeof res.body.token.accessToken).toBe('string');
    expect(res.body.token.expiresIn).toBeGreaterThan(0);
  });

  it('POST /api/v1/auth/register menolak telepon yang sudah dipakai (409)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Duplikat',
        phone: testPhone,
        password: 'rahasiaSekali123',
        role: 'CITIZEN',
      })
      .expect(409);
  });

  it('POST /api/v1/auth/register menolak telepon yang tidak valid (400 ID)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Salah',
        phone: 'bukan-telepon',
        password: 'rahasiaSekali123',
        role: 'CITIZEN',
      })
      .expect(400);
    expect(JSON.stringify(res.body.message)).toMatch(/Nomor telepon/i);
  });

  it('POST /api/v1/auth/login dengan kredensial benar menerbitkan token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ phone: testPhone, password: 'rahasiaSekali123' })
      .expect(200);
    expect(typeof res.body.token.accessToken).toBe('string');
    accessToken = res.body.token.accessToken;
  });

  it('POST /api/v1/auth/login menolak password salah dengan pesan generik', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ phone: testPhone, password: 'passwordSalah999' })
      .expect(401);
    expect(JSON.stringify(res.body.message)).toMatch(/Nomor telepon atau kata sandi salah/i);
  });

  it('GET /api/v1/auth/me tanpa token mengembalikan 401', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
  });

  it('GET /api/v1/auth/me dengan token mengembalikan profil', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(res.body.phone).toBe(testPhone);
    expect(res.body.role).toBe('CITIZEN');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('GET /api/v1/users/me dengan token juga mengembalikan profil yang sama', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(res.body.phone).toBe(testPhone);
  });

  it('GET /health tetap publik (tanpa JWT)', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.checks.postgis).toBe('ok');
  });
});
