import { MaterialGrade, MaterialType } from '@bingo/shared-types';

import { classifyByRecyclingCode } from '../pipeline';
import {
  MODEL_CONFIDENCE_THRESHOLD,
  MODEL_LABELS,
  calibrateProbabilities,
  verdictFromProbabilities,
} from '../visualClassifier';

describe('classifyByRecyclingCode', () => {
  it('memetakan kode 1 ke PET tanpa mengarang skor model', () => {
    const result = classifyByRecyclingCode(1);
    expect(result.materialType).toBe(MaterialType.PET);
    expect(result.materialGrade).toBeNull();
    expect(result.confident).toBe(true);
    expect(result.visualScore).toBeNull();
    expect(result.resinCode).toBe(1);
  });

  it('memetakan kode 7 ke plastik lainnya', () => {
    expect(classifyByRecyclingCode(7).materialType).toBe(MaterialType.OTHER_PLASTIC);
  });

  it('menolak menyimpulkan untuk kode tidak dikenal', () => {
    const result = classifyByRecyclingCode(99);
    expect(result.materialType).toBe(MaterialType.MIXED);
    expect(result.confident).toBe(false);
    expect(result.disposalTip).toBeNull();
  });
});

describe('kontrak keluaran model TrashScan', () => {
  it('menjaga urutan tujuh label sesuai labels.txt', () => {
    expect(MODEL_LABELS).toEqual([
      'PLASTIC',
      'PAPER',
      'CARDBOARD',
      'METAL',
      'GLASS',
      'ORGANIC',
      'MIXED',
    ]);
  });

  it('memetakan CARDBOARD ke PAPER dengan grade kardus', () => {
    const verdict = verdictFromProbabilities([0.01, 0.01, 0.94, 0.01, 0.01, 0.01, 0.01]);
    expect(verdict?.modelLabel).toBe('CARDBOARD');
    expect(verdict?.materialType).toBe(MaterialType.PAPER);
    expect(verdict?.materialGrade).toBe(MaterialGrade.KERTAS_KARDUS);
    expect(verdict?.confident).toBe(true);
  });

  it('menahan PLASTIC meski skornya tinggi karena resin belum diketahui', () => {
    const verdict = verdictFromProbabilities([0.97, 0.005, 0.005, 0.005, 0.005, 0.005, 0.005]);
    expect(verdict?.materialType).toBe(MaterialType.OTHER_PLASTIC);
    expect(verdict?.requiresResinCode).toBe(true);
    expect(verdict?.confident).toBe(false);
  });

  it('abstain ketika probabilitas terkalibrasi di bawah threshold', () => {
    const verdict = verdictFromProbabilities([0.35, 0.3, 0.1, 0.08, 0.07, 0.06, 0.04]);
    expect(verdict?.score).toBeLessThan(MODEL_CONFIDENCE_THRESHOLD);
    expect(verdict?.confident).toBe(false);
  });

  it('temperature scaling menghasilkan distribusi valid', () => {
    const calibrated = calibrateProbabilities([0.7, 0.1, 0.05, 0.05, 0.04, 0.03, 0.03]);
    expect(calibrated).not.toBeNull();
    expect(calibrated!.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 6);
    expect(calibrated![0]).toBeLessThan(0.7);
  });

  it('menolak tensor output dengan panjang salah', () => {
    expect(verdictFromProbabilities([1, 0])).toBeNull();
  });
});
