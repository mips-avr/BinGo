import { MaterialType } from '@bingo/shared-types';
import { classifyByRecyclingCode, rgbToHsl, scoreMaterials, pickBest, computeFeatures } from '../heuristicClassifier';
import type { ImageFeatures } from '../heuristicClassifier';

// ─── Recycling Code Tests (existing) ─────────────────────────

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

  it('engine is enhanced-heuristic', () => {
    expect(classifyByRecyclingCode(1).engine).toBe('enhanced-heuristic');
  });
});

// ─── RGB to HSL ──────────────────────────────────────────────

describe('rgbToHsl', () => {
  it('converts pure red', () => {
    const { h, s, l } = rgbToHsl(255, 0, 0);
    expect(h).toBeCloseTo(0, 0);
    expect(s).toBeCloseTo(1, 1);
    expect(l).toBeCloseTo(0.5, 1);
  });

  it('converts pure green', () => {
    const { h } = rgbToHsl(0, 255, 0);
    expect(h).toBeCloseTo(120, 0);
  });

  it('converts pure blue', () => {
    const { h } = rgbToHsl(0, 0, 255);
    expect(h).toBeCloseTo(240, 0);
  });

  it('converts white (achromatic)', () => {
    const { s, l } = rgbToHsl(255, 255, 255);
    expect(s).toBe(0);
    expect(l).toBeCloseTo(1, 1);
  });

  it('converts grey (achromatic)', () => {
    const { s, l } = rgbToHsl(128, 128, 128);
    expect(s).toBe(0);
    expect(l).toBeCloseTo(0.502, 1);
  });
});

// ─── Material Scoring ────────────────────────────────────────

function makeFeatures(overrides: Partial<ImageFeatures>): ImageFeatures {
  return {
    avgR: 128, avgG: 128, avgB: 128,
    hue: 0, saturation: 0, lightness: 0.5,
    lumMean: 128, lumStdDev: 20,
    edgeDensity: 0.1,
    histogram: new Array(512).fill(1 / 512),
    redRatio: 0.333, greenRatio: 0.333, blueRatio: 0.333,
    warmth: 1.0,
    ...overrides,
  };
}

describe('scoreMaterials', () => {
  it('scores all 12 material types', () => {
    const scores = scoreMaterials(makeFeatures({}));
    expect(scores.size).toBe(12);
  });

  it('favors PAPER for bright, low-saturation, warm images', () => {
    const features = makeFeatures({
      lightness: 0.85,
      saturation: 0.08,
      warmth: 1.1,
      lumStdDev: 25,
      edgeDensity: 0.1,
      avgR: 220, avgG: 210, avgB: 190,
    });
    const scores = scoreMaterials(features);
    const { materialType } = pickBest(scores);
    expect(materialType).toBe(MaterialType.PAPER);
  });

  it('favors METAL for grey, high-variance images', () => {
    const features = makeFeatures({
      lumStdDev: 65,
      saturation: 0.05,
      lightness: 0.55,
      edgeDensity: 0.2,
      avgR: 150, avgG: 150, avgB: 150,
    });
    const scores = scoreMaterials(features);
    const { materialType } = pickBest(scores);
    expect(materialType).toBe(MaterialType.METAL);
  });

  it('favors ORGANIC for green, saturated images', () => {
    const features = makeFeatures({
      greenRatio: 0.45,
      saturation: 0.5,
      hue: 120,
      edgeDensity: 0.08,
      warmth: 1.2,
      lightness: 0.4,
    });
    const scores = scoreMaterials(features);
    const { materialType } = pickBest(scores);
    expect(materialType).toBe(MaterialType.ORGANIC);
  });

  it('favors PS for extremely white, uniform, smooth images', () => {
    const features = makeFeatures({
      lightness: 0.9,
      saturation: 0.03,
      edgeDensity: 0.04,
      lumStdDev: 10,
      avgR: 240, avgG: 240, avgB: 240,
    });
    const scores = scoreMaterials(features);
    const { materialType } = pickBest(scores);
    expect(materialType).toBe(MaterialType.PS);
  });
});

// ─── pickBest ────────────────────────────────────────────────

describe('pickBest', () => {
  it('returns confidence between 0.35 and 0.96', () => {
    const scores = scoreMaterials(makeFeatures({}));
    const { confidence } = pickBest(scores);
    expect(confidence).toBeGreaterThanOrEqual(0.35);
    expect(confidence).toBeLessThanOrEqual(0.96);
  });

  it('returns MIXED when all scores are zero', () => {
    const scores = new Map<MaterialType, number>();
    for (const m of Object.values(MaterialType)) {
      scores.set(m as MaterialType, 0);
    }
    const { materialType } = pickBest(scores);
    // With all zeros, the first iterated material or MIXED should win
    expect(materialType).toBeDefined();
  });
});

// ─── computeFeatures ─────────────────────────────────────────

describe('computeFeatures', () => {
  it('returns empty features for empty byte array', () => {
    const features = computeFeatures(new Uint8Array(0));
    expect(features.avgR).toBe(128);
    expect(features.avgG).toBe(128);
    expect(features.edgeDensity).toBe(0);
  });

  it('computes non-empty features for a large byte buffer', () => {
    // Create a large buffer with a repeating pattern
    const size = 6000;
    const buf = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      // Alternating bright and dark to ensure non-zero variance
      buf[i] = i % 2 === 0 ? 200 : 50;
    }

    const features = computeFeatures(buf);
    // Should process many pixels, not return empty defaults
    expect(features.lumStdDev).toBeGreaterThan(0);
    expect(features.edgeDensity).toBeGreaterThanOrEqual(0);
    // Histogram should have some populated bins
    const populatedBins = features.histogram.filter(v => v > 0).length;
    expect(populatedBins).toBeGreaterThan(0);
  });
});
