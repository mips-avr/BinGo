import { MaterialType } from '@bingo/shared-types';
import { classifyByRecyclingCode } from '../pipeline';
import {
  MIN_VISUAL_EVIDENCE,
  VISUAL_CONFIDENCE_THRESHOLD,
  computeFeatures,
  pickBest,
  rgbToHsl,
  scoreMaterials,
} from '../visualClassifier';
import type { ImageFeatures } from '../visualClassifier';

// ─── Tahap 1: kode resin ─────────────────────────────────────

describe('classifyByRecyclingCode', () => {
  it('memetakan kode 1 ke PET', () => {
    const result = classifyByRecyclingCode(1);
    expect(result.materialType).toBe(MaterialType.PET);
    expect(result.confident).toBe(true);
    expect(result.disposalTip?.length ?? 0).toBeGreaterThan(10);
    expect(result.pointsHint).toBeGreaterThan(0);
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

  it('tidak pernah mengarang skor model untuk masukan pengguna', () => {
    const result = classifyByRecyclingCode(1);
    expect(result.source).toBe('resin-code');
    expect(result.visualScore).toBeNull();
    expect(result.resinCode).toBe(1);
  });
});

// ─── RGB ke HSL ──────────────────────────────────────────────

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

// ─── Tahap 2: penilaian visual ───────────────────────────────

function makeFeatures(overrides: Partial<ImageFeatures>): ImageFeatures {
  return {
    avgR: 128,
    avgG: 128,
    avgB: 128,
    hue: 0,
    saturation: 0,
    lightness: 0.5,
    lumStdDev: 20,
    edgeDensity: 0.1,
    redRatio: 1 / 3,
    greenRatio: 1 / 3,
    blueRatio: 1 / 3,
    ...overrides,
  };
}

describe('scoreMaterials', () => {
  it('scores all 12 material types', () => {
    const scores = scoreMaterials(makeFeatures({}));
    expect(scores.size).toBe(12);
  });

  it('favors PAPER for bright, low-saturation, warm images', () => {
    const scores = scoreMaterials(
      makeFeatures({
        lightness: 0.85,
        saturation: 0.08,
        lumStdDev: 25,
        edgeDensity: 0.1,
        avgR: 220,
        avgG: 210,
        avgB: 190,
      }),
    );
    expect(pickBest(scores).materialType).toBe(MaterialType.PAPER);
  });

  it('favors METAL for grey, high-variance images', () => {
    const scores = scoreMaterials(
      makeFeatures({
        lumStdDev: 65,
        saturation: 0.05,
        lightness: 0.55,
        edgeDensity: 0.2,
        avgR: 150,
        avgG: 150,
        avgB: 150,
      }),
    );
    expect(pickBest(scores).materialType).toBe(MaterialType.METAL);
  });

  it('favors ORGANIC for green, saturated images', () => {
    const scores = scoreMaterials(
      makeFeatures({
        greenRatio: 0.45,
        saturation: 0.5,
        hue: 120,
        edgeDensity: 0.08,
        lightness: 0.4,
      }),
    );
    expect(pickBest(scores).materialType).toBe(MaterialType.ORGANIC);
  });

  it('favors PS for extremely white, uniform, smooth images', () => {
    const scores = scoreMaterials(
      makeFeatures({
        lightness: 0.9,
        saturation: 0.03,
        edgeDensity: 0.04,
        lumStdDev: 10,
        avgR: 240,
        avgG: 240,
        avgB: 240,
      }),
    );
    expect(pickBest(scores).materialType).toBe(MaterialType.PS);
  });
});

// ─── pickBest: berani mengaku tidak tahu ─────────────────────

describe('pickBest', () => {
  it('menolak menyimpulkan ketika dua kelas hampir seimbang', () => {
    // Styrofoam dan plastik film memang sulit dibedakan dari warna saja: foto
    // yang sangat terang, tanpa warna, dan rata memicu keduanya hampir sama
    // kuat. Di situlah sistem harus mengaku ragu, bukan memilih salah satu.
    const verdict = pickBest(
      scoreMaterials(
        makeFeatures({ lightness: 0.9, saturation: 0.03, edgeDensity: 0.04, lumStdDev: 10 }),
      ),
    );
    expect(verdict.score).toBeLessThan(VISUAL_CONFIDENCE_THRESHOLD);
    expect(verdict.confident).toBe(false);
  });

  it('mengembalikan MIXED ketika bukti di bawah ambang minimum', () => {
    const scores = new Map<MaterialType, number>();
    for (const material of Object.values(MaterialType)) {
      scores.set(material as MaterialType, MIN_VISUAL_EVIDENCE - 1);
    }
    const verdict = pickBest(scores);
    expect(verdict.materialType).toBe(MaterialType.MIXED);
    expect(verdict.confident).toBe(false);
  });
});

// ─── computeFeatures bekerja pada piksel sungguhan ───────────

describe('computeFeatures', () => {
  it('menghitung rata-rata warna yang tepat untuk bidang warna solid', () => {
    const width = 8;
    const height = 8;
    const rgba = new Uint8Array(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      rgba[i * 4] = 10;
      rgba[i * 4 + 1] = 200;
      rgba[i * 4 + 2] = 60;
      rgba[i * 4 + 3] = 255;
    }
    const features = computeFeatures(rgba, width, height);
    expect(features.avgR).toBe(10);
    expect(features.avgG).toBe(200);
    expect(features.avgB).toBe(60);
    // Bidang solid tidak punya tepi dan tidak punya sebaran luminansi.
    expect(features.edgeDensity).toBe(0);
    expect(features.lumStdDev).toBeCloseTo(0, 3);
  });

  it('mengenali tepi pada papan catur hitam-putih', () => {
    const width = 8;
    const height = 8;
    const rgba = new Uint8Array(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const value = (x + y) % 2 === 0 ? 255 : 0;
        const i = (y * width + x) * 4;
        rgba[i] = value;
        rgba[i + 1] = value;
        rgba[i + 2] = value;
        rgba[i + 3] = 255;
      }
    }
    const features = computeFeatures(rgba, width, height);
    // Setiap piksel selain yang pertama berbeda tajam dari tetangganya.
    expect(features.edgeDensity).toBe(1);
    expect(features.lumStdDev).toBeGreaterThan(100);
    expect(features.saturation).toBe(0);
  });
});
