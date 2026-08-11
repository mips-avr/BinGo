import {
  emptyLine,
  hasErrors,
  parseNumber,
  previewLine,
  previewTotals,
  toCreateRequest,
  validateDraft,
  type DraftLine,
  type DraftReceipt,
} from '../draft';

function line(overrides: Partial<DraftLine> = {}): DraftLine {
  return {
    ...emptyLine('l1'),
    grade: 'PET_BOTOL_BENING',
    weightKg: '10',
    pricePerKg: '2500',
    ...overrides,
  };
}

function draft(overrides: Partial<DraftReceipt> = {}): DraftReceipt {
  return {
    partnerName: 'Bank Sampah Melati',
    region: 'Kecamatan Beji, Depok',
    scaleTeraNo: '',
    notes: '',
    lines: [line()],
    ...overrides,
  };
}

describe('parseNumber', () => {
  it('menerima koma sebagai pemisah desimal', () => {
    expect(parseNumber('12,5')).toBe(12.5);
    expect(parseNumber('12.5')).toBe(12.5);
  });

  it('menganggap string kosong sebagai nol', () => {
    expect(parseNumber('')).toBe(0);
    expect(parseNumber('   ')).toBe(0);
  });

  it('mengembalikan NaN untuk teks yang bukan angka', () => {
    expect(Number.isNaN(parseNumber('abc'))).toBe(true);
  });
});

describe('previewLine', () => {
  it('mengalikan berat bersih dengan harga per kg', () => {
    expect(previewLine(line())).toEqual({
      netWeightKg: 10,
      grossAmount: 25000,
      subtotal: 25000,
    });
  });

  it('mengurangi potongan berat lebih dulu', () => {
    const result = previewLine(line({ deductionKg: '1,5', deductionReason: 'Kadar air' }));
    expect(result.netWeightKg).toBe(8.5);
    expect(result.grossAmount).toBe(21250);
  });

  it('mengurangi potongan rupiah dari nilai kotor, bukan dari harga', () => {
    const result = previewLine(
      line({ pricePerKg: '1260', weightKg: '20', deductionAmount: '5000', deductionReason: 'Angkut' }),
    );
    expect(result.grossAmount).toBe(25200);
    expect(result.subtotal).toBe(20200);
  });

  it('tidak menghasilkan berat negatif bila potongan melebihi berat', () => {
    const result = previewLine(line({ weightKg: '2', deductionKg: '5' }));
    expect(result.netWeightKg).toBe(0);
  });
});

describe('previewTotals', () => {
  it('menjumlahkan seluruh baris', () => {
    const totals = previewTotals([
      line({ weightKg: '4', pricePerKg: '2500' }),
      { ...line(), key: 'l2', grade: 'KERTAS_KORAN', weightKg: '6,25', pricePerKg: '3000' },
    ]);
    expect(totals.totalWeightKg).toBe(10.25);
    expect(totals.totalGrossAmount).toBe(10000 + 18750);
    expect(totals.totalNetAmount).toBe(28750);
  });
});

describe('validateDraft', () => {
  it('menerima draf yang benar', () => {
    expect(hasErrors(validateDraft(draft()))).toBe(false);
  });

  it('menolak nama titik penerima yang terlalu pendek', () => {
    expect(validateDraft(draft({ partnerName: 'AB' })).partnerName).toBeTruthy();
  });

  it('menolak wilayah kosong', () => {
    expect(validateDraft(draft({ region: '' })).region).toBeTruthy();
  });

  it('menolak baris tanpa grade', () => {
    const errors = validateDraft(draft({ lines: [line({ grade: null })] }));
    expect(errors.lines.l1).toBe('Pilih jenis material');
  });

  it('menolak berat nol', () => {
    const errors = validateDraft(draft({ lines: [line({ weightKg: '0' })] }));
    expect(errors.lines.l1).toBe('Berat harus lebih dari 0');
  });

  it('menolak potongan berat yang melebihi berat timbang', () => {
    const errors = validateDraft(
      draft({ lines: [line({ deductionKg: '12', deductionReason: 'Kadar air' })] }),
    );
    expect(errors.lines.l1).toBe('Potongan berat melebihi berat timbang');
  });

  it('mewajibkan alasan pada setiap potongan', () => {
    expect(validateDraft(draft({ lines: [line({ deductionKg: '1' })] })).lines.l1).toBe(
      'Potongan wajib diberi alasan',
    );
    expect(validateDraft(draft({ lines: [line({ deductionAmount: '1000' })] })).lines.l1).toBe(
      'Potongan wajib diberi alasan',
    );
  });

  it('menolak potongan yang membuat pembayaran negatif', () => {
    const errors = validateDraft(
      draft({
        lines: [
          line({
            weightKg: '2',
            pricePerKg: '50',
            deductionAmount: '5000',
            deductionReason: 'Angkut',
          }),
        ],
      }),
    );
    expect(errors.lines.l1).toBe('Potongan membuat pembayaran menjadi negatif');
  });
});

describe('toCreateRequest', () => {
  it('membuang field potongan yang kosong agar payload bersih', () => {
    const body = toCreateRequest(draft(), 'seller-1');
    expect(body.lines[0]).toEqual({
      grade: 'PET_BOTOL_BENING',
      weightKg: 10,
      pricePerKg: 2500,
    });
    expect(body).not.toHaveProperty('pickupRequestId');
    expect(body).not.toHaveProperty('scaleTeraNo');
  });

  it('menyertakan potongan beserta alasannya bila diisi', () => {
    const body = toCreateRequest(
      draft({
        scaleTeraNo: ' DKI-2025-01 ',
        lines: [line({ deductionKg: '1,5', deductionAmount: '2000', deductionReason: ' Kadar air ' })],
      }),
      'seller-1',
      'pickup-1',
    );
    expect(body.scaleTeraNo).toBe('DKI-2025-01');
    expect(body.pickupRequestId).toBe('pickup-1');
    expect(body.lines[0]).toMatchObject({
      deductionKg: 1.5,
      deductionAmount: 2000,
      deductionReason: 'Kadar air',
    });
  });
});
