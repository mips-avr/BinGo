import { MaterialType } from '@bingo/shared-types';
import { classifyByRecyclingCode } from '../heuristicClassifier';

describe('classifyByRecyclingCode', () => {
  it('memetakan kode 1 ke PET', () => {
    const result = classifyByRecyclingCode(1);
    expect(result.materialType).toBe(MaterialType.PET);
    expect(result.confidence).toBeGreaterThan(0.9);
    expect(result.disposalTip.length).toBeGreaterThan(10);
    expect(result.pointsHint).toBeGreaterThan(0);
  });

  it('memetakan kode 7 ke plastik lainnya', () => {
    expect(classifyByRecyclingCode(7).materialType).toBe(MaterialType.OTHER_PLASTIC);
  });

  it('fallback campuran untuk kode tidak dikenal', () => {
    expect(classifyByRecyclingCode(99).materialType).toBe(MaterialType.MIXED);
  });
});
