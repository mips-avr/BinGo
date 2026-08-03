import { render } from '@testing-library/react-native';
import type { PriceBandDto, WeighingReceiptDto } from '@bingo/shared-types';
import { ReceiptView } from '../ReceiptView';
import { PriceBandCard } from '../PriceBandCard';

const receipt: WeighingReceiptDto = {
  id: 'r1',
  receiptNo: 'BG-260803-AB2C',
  pickupRequestId: null,
  sellerId: 'c1',
  issuedById: 'a1',
  partnerName: 'Bank Sampah Melati',
  scaleTeraNo: 'DKI-2025-004821',
  scaleVerified: true,
  region: 'Kecamatan Beji, Depok',
  lines: [
    {
      id: 'l1',
      grade: 'PET_BOTOL_BENING',
      weightKg: 10,
      deductionKg: 1.5,
      deductionReason: 'Kadar air tinggi',
      netWeightKg: 8.5,
      pricePerKg: 2500,
      deductionAmount: 2000,
      grossAmount: 21250,
      subtotal: 19250,
    },
  ],
  totalWeightKg: 10,
  totalDeductionKg: 1.5,
  totalNetWeightKg: 8.5,
  totalGrossAmount: 21250,
  totalDeductionAmount: 2000,
  totalNetAmount: 19250,
  notes: null,
  createdAt: new Date('2026-08-03T10:00:00Z').toISOString(),
};

describe('<ReceiptView />', () => {
  it('menampilkan nomor bukti dan titik penerima', () => {
    const { getByText } = render(<ReceiptView receipt={receipt} />);
    expect(getByText('BG-260803-AB2C')).toBeTruthy();
    expect(getByText('Bank Sampah Melati')).toBeTruthy();
  });

  it('menampilkan potongan sebagai baris tersendiri beserta alasannya', () => {
    const { getByText, getAllByText } = render(<ReceiptView receipt={receipt} />);
    // Alasan ditulis sekali per baris material, bukan diulang di tiap potongan.
    expect(getByText(/Kadar air tinggi/)).toBeTruthy();
    // Potongan berat muncul di baris material dan sekali lagi di ringkasan total.
    expect(getAllByText('−1.5 kg')).toHaveLength(2);
    // Potongan rupiah muncul di baris material dan sekali lagi di ringkasan total.
    expect(getAllByText('−Rp 2.000')).toHaveLength(2);
  });

  it('tidak melebur potongan ke dalam harga per kg', () => {
    const { getByText, getAllByText } = render(<ReceiptView receipt={receipt} />);
    // Harga tetap utuh meski ada potongan.
    expect(getByText('Rp 2.500 / kg')).toBeTruthy();
    // Nilai kotor tampil di baris material dan di ringkasan total.
    expect(getAllByText('Rp 21.250')).toHaveLength(2);
  });

  it('menampilkan jumlah yang benar-benar dibayarkan', () => {
    const { getAllByText } = render(<ReceiptView receipt={receipt} />);
    expect(getAllByText('Rp 19.250').length).toBeGreaterThan(0);
  });

  it('menandai bukti tanpa nomor tera', () => {
    const { getByText } = render(
      <ReceiptView receipt={{ ...receipt, scaleTeraNo: null, scaleVerified: false }} />,
    );
    expect(getByText('Tanpa nomor tera')).toBeTruthy();
  });
});

const band: PriceBandDto = {
  grade: 'PET_BOTOL_BENING',
  label: 'Botol plastik bening',
  region: 'Kecamatan Beji, Depok',
  p25: 2300,
  median: 2500,
  p75: 2700,
  sampleCount: 5,
  partnerCount: 3,
  lastReportedAt: new Date('2026-08-03T09:00:00Z').toISOString(),
};

describe('<PriceBandCard />', () => {
  it('menonjolkan median tetapi tetap menampilkan sebaran', () => {
    const { getByText } = render(<PriceBandCard band={band} />);
    expect(getByText('Botol plastik bening')).toBeTruthy();
    expect(getByText('Rp 2.500')).toBeTruthy();
    expect(getByText('Rp 2.300')).toBeTruthy();
    expect(getByText('Rp 2.700')).toBeTruthy();
  });

  it('menyebut jumlah bukti dan jumlah titik penerima', () => {
    const { getByText } = render(<PriceBandCard band={band} />);
    expect(getByText(/5 bukti timbang/)).toBeTruthy();
    expect(getByText(/3 titik penerima/)).toBeTruthy();
  });
});
