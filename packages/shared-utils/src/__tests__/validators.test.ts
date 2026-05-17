import { isValidNIK, isValidPhoneID, normalizePhoneID } from '../validators';
import { formatIDR } from '../currency';

describe('isValidNIK', () => {
  it('menerima NIK 16 digit yang masuk akal', () => {
    // 31 = DKI Jakarta, kecamatan 7401, tgl lahir 010190
    expect(isValidNIK('3174010101900001')).toBe(true);
  });

  it('menolak NIK bukan 16 digit', () => {
    expect(isValidNIK('123')).toBe(false);
    expect(isValidNIK('31740101019000010')).toBe(false);
  });

  it('menolak NIK dengan tanggal lahir tidak valid', () => {
    // Format NIK: PPKKCC DD MM YY NNNN (pos 6-7 = hari, pos 8-9 = bulan)
    expect(isValidNIK('3174013201900001')).toBe(false); // hari 32 (bukan perempuan offset 40)
    expect(isValidNIK('3174010113900001')).toBe(false); // bulan 13
  });
});

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
