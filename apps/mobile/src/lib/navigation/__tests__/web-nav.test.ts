import { publicWebPath, webRouteMatches } from '../web-nav';

describe('web sidebar routing', () => {
  it('menghapus route group Expo dari URL navigasi', () => {
    expect(publicWebPath('/(platform)/facilities')).toBe('/facilities');
    expect(publicWebPath('/(manager)')).toBe('/');
  });

  it('menandai menu aktif berdasarkan path publik', () => {
    expect(webRouteMatches({ href: '/(platform)/facilities' }, '/facilities')).toBe(true);
    expect(webRouteMatches({ href: '/(platform)' }, '/facilities')).toBe(false);
  });

  it('mendukung halaman turunan yang ditempatkan sebagai route saudara', () => {
    expect(
      webRouteMatches(
        {
          href: '/(manager)/customers',
          matches: ['/(manager)/households', '/(manager)/subscriptions'],
        },
        '/households',
      ),
    ).toBe(true);
  });
});
