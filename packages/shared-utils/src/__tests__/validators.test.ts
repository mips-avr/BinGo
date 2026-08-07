import { isValidPhoneID, normalizePhoneID } from '../validators';
import { formatIDR } from '../currency';

// Berkas ini pernah menguji `isValidNIK`. Fungsinya dihapus bersama seluruh
// jalur pengumpulan NIK; lihat catatan di src/validators.ts.

describe('normalizePhoneID', () => {
  it('menormalkan format umum ke +62…', () => {
    expect(normalizePhoneID('08123456789')).toBe('+628123456789');
    expect(normalizePhoneID('8123456789')).toBe('+628123456789');
    expect(normalizePhoneID('+628123456789')).toBe('+628123456789');
    expect(normalizePhoneID('+62 812-3456-789')).toBe('+628123456789');
  });

  it('mengembalikan null untuk format aneh', () => {
    expect(normalizePhoneID('123')).toBeNull();
    expect(normalizePhoneID('abc')).toBeNull();
  });
});

describe('isValidPhoneID', () => {
  it('selaras dengan normalizePhoneID', () => {
    expect(isValidPhoneID('08123456789')).toBe(true);
    expect(isValidPhoneID('abc')).toBe(false);
  });
});

describe('formatIDR', () => {
  it('memformat angka ke format Rupiah', () => {
    expect(formatIDR(1500000)).toBe('Rp 1.500.000');
    expect(formatIDR(0)).toBe('Rp 0');
    expect(formatIDR(1500000, { withSymbol: false })).toBe('1.500.000');
  });

  it('tahan terhadap input invalid', () => {
    expect(formatIDR(Number.NaN)).toBe('Rp 0');
  });
});
