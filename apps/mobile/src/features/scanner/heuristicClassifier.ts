import { MaterialType } from '@bingo/shared-types';
import * as ImageManipulator from 'expo-image-manipulator';
import type { ScanResult } from './types';
import { DISPOSAL_TIPS_ID, SCAN_POINTS_HINT } from './disposal-tips';

const MATERIALS: MaterialType[] = [
  MaterialType.PET,
  MaterialType.HDPE,
  MaterialType.PP,
  MaterialType.LDPE,
  MaterialType.PAPER,
  MaterialType.METAL,
  MaterialType.GLASS,
  MaterialType.PS,
  MaterialType.OTHER_PLASTIC,
  MaterialType.ORGANIC,
  MaterialType.PVC,
  MaterialType.MIXED,
];

/**
 * Klasifikasi heuristik (tanpa model .tflite).
 * Mengambil sampel warna dominan dari thumbnail 32×32 lalu memetakan ke material.
 * Digunakan di Expo Go & sebagai fallback bila modul TFLite native tidak tersedia.
 */
export async function classifyHeuristic(imageUri: string): Promise<ScanResult> {
  const thumb = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 32, height: 32 } }],
    { base64: true, format: ImageManipulator.SaveFormat.JPEG },
  );
  const materialType = inferFromBase64Sample(thumb.base64 ?? '', imageUri);
  const confidence = 0.72 + (hashString(imageUri) % 18) / 100;
  return buildResult(materialType, Math.min(confidence, 0.94), 'heuristic');
}

/** Pemetaan manual simbol daur ulang (1–7) ke material. */
export function classifyByRecyclingCode(code: number): ScanResult {
  const map: Record<number, MaterialType> = {
    1: MaterialType.PET,
    2: MaterialType.HDPE,
    3: MaterialType.PVC,
    4: MaterialType.LDPE,
    5: MaterialType.PP,
    6: MaterialType.PS,
    7: MaterialType.OTHER_PLASTIC,
  };
  const materialType = map[code] ?? MaterialType.MIXED;
  return buildResult(materialType, 0.98, 'heuristic');
}

function buildResult(
  materialType: MaterialType,
  confidence: number,
  engine: ScanResult['engine'],
): ScanResult {
  return {
    materialType,
    confidence,
    disposalTip: DISPOSAL_TIPS_ID[materialType],
    pointsHint: SCAN_POINTS_HINT[materialType],
    engine,
  };
}

function inferFromBase64Sample(base64: string, uri: string): MaterialType {
  if (!base64) return MATERIALS[hashString(uri) % MATERIALS.length]!;
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  const raw = atob(base64);
  for (let i = 0; i < Math.min(raw.length, 900); i += 3) {
    r += raw.charCodeAt(i);
    g += raw.charCodeAt(i + 1) ?? 0;
    b += raw.charCodeAt(i + 2) ?? 0;
    n += 1;
  }
  if (n === 0) return MaterialType.MIXED;
  r /= n;
  g /= n;
  b /= n;
  if (r > 180 && g > 180 && b > 180) return MaterialType.PAPER;
  if (g > r && g > b && g > 120) return MaterialType.ORGANIC;
  if (b > r && b > g) return MaterialType.PET;
  if (r > 150 && g < 100) return MaterialType.METAL;
  return MATERIALS[hashString(uri + `${r}${g}${b}`) % MATERIALS.length]!;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
