import { getAuthenticatedHome } from '../role-routes';

describe('getAuthenticatedHome', () => {
  it('mengarahkan warga ke tab warga', () => {
    expect(getAuthenticatedHome('CITIZEN')).toBe('/(tabs)');
  });

  it('mengarahkan pemulung ke tab pemulung', () => {
    expect(getAuthenticatedHome('WASTE_AGENT')).toBe('/(agent-tabs)');
  });

  it('mengarahkan UMKM ke tab warga (marketplace)', () => {
    expect(getAuthenticatedHome('MSME')).toBe('/(tabs)');
  });
});
