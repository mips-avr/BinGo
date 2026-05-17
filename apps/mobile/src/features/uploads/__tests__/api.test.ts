jest.mock('../../../lib/api/client', () => ({
  api: { post: jest.fn() },
}));

import { api } from '../../../lib/api/client';
import { uploadImage } from '../api';

describe('uploadImage', () => {
  afterEach(() => jest.clearAllMocks());

  it('mengirim multipart/form-data dengan MIME yang ditebak dari ekstensi', async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: {
        url: 'https://api.bingo.id/uploads/abc.png',
        filename: 'abc.png',
        size: 1234,
        mimeType: 'image/png',
      },
    });

    const res = await uploadImage('file:///tmp/photo.png');

    expect(res.url).toContain('uploads/abc.png');
    const [endpoint, formData, config] = (api.post as jest.Mock).mock.calls[0] as [
      string,
      FormData,
      { headers?: { 'Content-Type': string } },
    ];
    expect(endpoint).toBe('/api/v1/uploads/image');
    expect(formData).toBeDefined();
    expect(config.headers?.['Content-Type']).toBe('multipart/form-data');
  });

  it('default ke image/jpeg untuk ekstensi tidak dikenal', async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: { url: 'x', filename: 'x', size: 0, mimeType: 'image/jpeg' },
    });
    await uploadImage('file:///tmp/no-ext');
    expect(api.post).toHaveBeenCalled();
  });
});
