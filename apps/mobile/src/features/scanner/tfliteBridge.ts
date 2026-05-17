import type { ScanResult } from './types';
import { classifyHeuristic } from './heuristicClassifier';

let tfliteAvailable: boolean | null = null;

/**
 * Mencoba memuat inferensi TFLite native (`react-native-fast-tflite`).
 * Modul ini hanya tersedia pada development build (bukan Expo Go).
 * Bila tidak ada, pemanggil harus memakai `classifyHeuristic`.
 */
export async function tryClassifyTflite(imageUri: string): Promise<ScanResult | null> {
  if (tfliteAvailable === false) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Tflite = require('react-native-fast-tflite') as {
      loadTensorflowModel: (source: number) => Promise<{
        run: (input: Float32Array) => Promise<Float32Array>;
      }>;
    };
    if (!Tflite?.loadTensorflowModel) {
      tfliteAvailable = false;
      return null;
    }
    // Model kustom belum dibundel — integrasi siap, fallback ke heuristik.
    tfliteAvailable = false;
    return null;
  } catch {
    tfliteAvailable = false;
    return null;
  }
}

/** Pipeline utama: TFLite jika tersedia, selain itu heuristik. */
export async function classifyPackaging(imageUri: string): Promise<ScanResult> {
  const tflite = await tryClassifyTflite(imageUri);
  if (tflite) return tflite;
  return classifyHeuristic(imageUri);
}
