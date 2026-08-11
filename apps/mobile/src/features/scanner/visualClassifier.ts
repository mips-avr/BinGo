import { MaterialGrade, MaterialType } from '@bingo/shared-types';
import * as ImageManipulator from 'expo-image-manipulator';
import type { TfliteModel } from 'react-native-fast-tflite';

import { base64ToBytes } from '../../lib/codec/base64';
import { decodePng } from './pngDecode';

/** Ukuran tensor input MobileNetV3-Small yang dipakai saat pelatihan. */
export const MODEL_INPUT_SIZE = 224;

/**
 * Urutan ini adalah kontrak tensor output. Jangan diurutkan alfabetis dan
 * jangan diubah tanpa mengekspor ulang model beserta labels.txt.
 */
export const MODEL_LABELS = [
  'PLASTIC',
  'PAPER',
  'CARDBOARD',
  'METAL',
  'GLASS',
  'ORGANIC',
  'MIXED',
] as const;
export type ModelLabel = (typeof MODEL_LABELS)[number];

/** Dipilih pada validation set, bukan test set. */
export const MODEL_TEMPERATURE = 1.3;
export const MODEL_CONFIDENCE_THRESHOLD = 0.75;

interface AppMapping {
  materialType: MaterialType;
  materialGrade: MaterialGrade | null;
  requiresResinCode: boolean;
}

const MODEL_TO_APP: Record<ModelLabel, AppMapping> = {
  PLASTIC: {
    materialType: MaterialType.OTHER_PLASTIC,
    materialGrade: null,
    requiresResinCode: true,
  },
  PAPER: {
    materialType: MaterialType.PAPER,
    materialGrade: null,
    requiresResinCode: false,
  },
  CARDBOARD: {
    materialType: MaterialType.PAPER,
    materialGrade: MaterialGrade.KERTAS_KARDUS,
    requiresResinCode: false,
  },
  METAL: {
    materialType: MaterialType.METAL,
    materialGrade: null,
    requiresResinCode: false,
  },
  GLASS: {
    materialType: MaterialType.GLASS,
    materialGrade: null,
    requiresResinCode: false,
  },
  ORGANIC: {
    materialType: MaterialType.ORGANIC,
    materialGrade: null,
    requiresResinCode: false,
  },
  MIXED: {
    materialType: MaterialType.MIXED,
    materialGrade: null,
    requiresResinCode: false,
  },
};

export interface VisualVerdict {
  /** Kelas visual mentah dari model, sebelum dipetakan ke enum aplikasi. */
  modelLabel: ModelLabel;
  materialType: MaterialType;
  materialGrade: MaterialGrade | null;
  /** Probabilitas kelas teratas setelah temperature scaling. */
  score: number;
  /**
   * PLASTIC selalu meminta kode resin/koreksi pengguna. Dataset lintas-sumber
   * tidak memberi label resin yang konsisten, sehingga OTHER_PLASTIC tidak
   * boleh ditegakkan hanya dari foto.
   */
  requiresResinCode: boolean;
  confident: boolean;
}

let modelPromise: Promise<TfliteModel> | null = null;

/** Muat satu kali dan pakai ulang untuk pemindaian berikutnya. */
async function getModel(): Promise<TfliteModel> {
  if (!modelPromise) {
    modelPromise = (async () => {
      const { loadTensorflowModel } = await import('react-native-fast-tflite');
      // require harus tetap literal agar Metro memasukkan model ke bundle.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const asset = require('../../assets/trashscan/model_float32.tflite') as number;
      const model = await loadTensorflowModel(asset, []);

      const input = model.inputs[0];
      const output = model.outputs[0];
      const validInput =
        input?.dataType === 'float32' &&
        input.shape.length === 4 &&
        input.shape[0] === 1 &&
        input.shape[1] === MODEL_INPUT_SIZE &&
        input.shape[2] === MODEL_INPUT_SIZE &&
        input.shape[3] === 3;
      const validOutput =
        output?.dataType === 'float32' &&
        output.shape[output.shape.length - 1] === MODEL_LABELS.length;

      if (!validInput || !validOutput) {
        throw new Error(
          `Kontrak model TrashScan tidak cocok: input=${JSON.stringify(input)}, output=${JSON.stringify(output)}`,
        );
      }
      return model;
    })().catch((error) => {
      // Izinkan tombol coba lagi benar-benar mencoba memuat ulang.
      modelPromise = null;
      throw error;
    });
  }
  return modelPromise;
}

/**
 * Samakan preprocessing dengan notebook: RGB float32 mentah 0–255, 224×224.
 * Normalisasi [-1,1] sudah tertanam di dalam MobileNetV3.
 */
export async function photoToModelInput(imageUri: string): Promise<Float32Array | null> {
  let base64: string | undefined;
  try {
    const resized = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: MODEL_INPUT_SIZE, height: MODEL_INPUT_SIZE } }],
      { base64: true, format: ImageManipulator.SaveFormat.PNG },
    );
    base64 = resized.base64 ?? undefined;
  } catch {
    return null;
  }
  if (!base64) return null;

  const bytes = base64ToBytes(base64);
  if (!bytes) return null;
  const image = decodePng(bytes);
  if (!image || image.width !== MODEL_INPUT_SIZE || image.height !== MODEL_INPUT_SIZE) return null;

  const rgb = new Float32Array(MODEL_INPUT_SIZE * MODEL_INPUT_SIZE * 3);
  for (let src = 0, dst = 0; src < image.rgba.length; src += 4) {
    rgb[dst++] = image.rgba[src]!;
    rgb[dst++] = image.rgba[src + 1]!;
    rgb[dst++] = image.rgba[src + 2]!;
  }
  return rgb;
}

/** Terapkan temperature scaling yang dipilih notebook pada probabilitas softmax. */
export function calibrateProbabilities(raw: readonly number[]): number[] | null {
  if (raw.length !== MODEL_LABELS.length) return null;
  const logits = raw.map((value) => Math.log(Math.max(value, 1e-9)) / MODEL_TEMPERATURE);
  if (logits.some((value) => !Number.isFinite(value))) return null;
  const max = Math.max(...logits);
  const exp = logits.map((value) => Math.exp(value - max));
  const total = exp.reduce((sum, value) => sum + value, 0);
  if (!Number.isFinite(total) || total <= 0) return null;
  return exp.map((value) => value / total);
}

/** Fungsi murni agar urutan label, mapping, dan abstain dapat diuji tanpa native runtime. */
export function verdictFromProbabilities(raw: readonly number[]): VisualVerdict | null {
  const probabilities = calibrateProbabilities(raw);
  if (!probabilities) return null;

  let bestIndex = 0;
  for (let index = 1; index < probabilities.length; index++) {
    if (probabilities[index]! > probabilities[bestIndex]!) bestIndex = index;
  }

  const modelLabel = MODEL_LABELS[bestIndex]!;
  const mapping = MODEL_TO_APP[modelLabel];
  const score = probabilities[bestIndex]!;
  return {
    modelLabel,
    materialType: mapping.materialType,
    materialGrade: mapping.materialGrade,
    score,
    requiresResinCode: mapping.requiresResinCode,
    confident: score >= MODEL_CONFIDENCE_THRESHOLD && !mapping.requiresResinCode,
  };
}

/** Foto → tensor → TFLite → hasil terkalibrasi. `null` adalah galat yang jujur. */
export async function estimateFromPhoto(imageUri: string): Promise<VisualVerdict | null> {
  try {
    const input = await photoToModelInput(imageUri);
    if (!input) return null;
    const model = await getModel();
    // Float32Array yang dibuat di atas selalu memiliki ArrayBuffer biasa;
    // cast diperlukan karena TypeScript mendeklarasikan `.buffer` lebih luas.
    const outputs = await model.run([input.buffer as ArrayBuffer]);
    const output = outputs[0];
    if (!output) return null;
    return verdictFromProbabilities(Array.from(new Float32Array(output)));
  } catch {
    return null;
  }
}
