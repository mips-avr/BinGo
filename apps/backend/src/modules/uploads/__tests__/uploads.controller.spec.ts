import { put } from '@vercel/blob';
import type { Request } from 'express';
import { UploadsController } from '../uploads.controller';

jest.mock('@vercel/blob', () => ({ put: jest.fn() }));
jest.mock('../uploads.constants', () => ({
  UPLOADS_DIR: '/tmp/bingo-test-uploads',
  USES_BLOB_STORAGE: true,
}));

describe('UploadsController', () => {
  const controller = new UploadsController();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BLOB_READ_WRITE_TOKEN = 'vercel_blob_test_token';
  });

  afterAll(() => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
  });

  it('mengunggah buffer ke Blob dengan nama yang ditentukan server', async () => {
    (put as jest.Mock).mockResolvedValue({
      url: 'https://blob.example/reports/generated.jpg',
    });
    const file = {
      buffer: Buffer.from('fake-jpeg'),
      mimetype: 'image/jpeg',
      size: 9,
      originalname: '../../evil.html',
    } as Express.Multer.File;

    const result = await controller.uploadImage({} as Request, file);

    expect(put).toHaveBeenCalledWith(
      expect.stringMatching(/^reports\/\d+-[0-9a-f-]+\.jpg$/),
      file.buffer,
      expect.objectContaining({
        access: 'public',
        addRandomSuffix: false,
        contentType: 'image/jpeg',
        token: 'vercel_blob_test_token',
      }),
    );
    expect(result).toEqual({
      url: 'https://blob.example/reports/generated.jpg',
      filename: expect.stringMatching(/^\d+-[0-9a-f-]+\.jpg$/),
      size: 9,
      mimeType: 'image/jpeg',
    });
    expect(result.filename).not.toContain('evil');
  });
});
