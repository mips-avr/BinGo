import type { ScanResult } from './types';
import { classifyHeuristic } from './heuristicClassifier';

/**
 * TFLite dinonaktifkan untuk MVP Expo Go.
 * Saat dev build tersedia, modul ini akan memuat model .tflite
 * dan mengembalikan ScanResult bertipe engine='tflite'.
 */
export async function tryClassifyTflite(_imageUri: string): Promise<ScanResult | null> {
  return null;
}

/**
 * Pipeline utama TrashScan:
 * 1. Coba TFLite (dev build) → jika tersedia, return hasilnya.
 * 2. Fallback ke enhanced-heuristic (multi-feature scoring).
 */
export async function classifyPackaging(imageUri: string): Promise<ScanResult> {
  const tflite = await tryClassifyTflite(imageUri);
  if (tflite) return tflite;
  return classifyHeuristic(imageUri);
}
