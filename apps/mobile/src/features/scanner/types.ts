import type { MaterialType } from '@bingo/shared-types';

/** Hasil klasifikasi kemasan (output kompatibel pipeline TFLite). */
export interface ScanResult {
  materialType: MaterialType;
  confidence: number;
  disposalTip: string;
  pointsHint: number;
  /**
   * `enhanced-heuristic` = multi-feature color/edge analysis (Expo Go compatible);
   * `tflite` = inferensi native CNN (dev build only).
   */
  engine: 'enhanced-heuristic' | 'tflite';
}
