import { getAuthenticatedHome } from '../role-routes';

describe('getAuthenticatedHome', () => {
  it('mengarahkan warga ke tab warga', () => {
    expect(getAuthenticatedHome('CITIZEN')).toBe('/(tabs)');
  });

  it('mengarahkan role petugas lama ke pengalaman Petugas', () => {
    expect(getAuthenticatedHome('WASTE_AGENT')).toBe('/(collector-tabs)');
  });

  it('mengarahkan role business lama ke dashboard Business', () => {
    expect(getAuthenticatedHome('MSME')).toBe('/(business)');
  });
});
