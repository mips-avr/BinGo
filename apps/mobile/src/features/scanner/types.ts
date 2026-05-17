import type { MaterialType } from '@bingo/shared-types';

/** Hasil klasifikasi kemasan (output kompatibel pipeline TFLite). */
export interface ScanResult {
  materialType: MaterialType;
  confidence: number;
  disposalTip: string;
  pointsHint: number;
  /** `heuristic` = fallback tanpa model; `tflite` = inferensi native (dev build). */
  engine: 'heuristic' | 'tflite';
}
