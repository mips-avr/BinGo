import type { CreateWeighingReceiptRequest, MaterialGrade } from '@bingo/shared-types';
import { t } from '../../i18n';

/**
 * Bentuk isian formulir sebelum dikirim ke API.
 *
 * Semua angka disimpan sebagai string karena berasal dari `TextInput`, dan
 * pengguna sering mengetik koma sebagai pemisah desimal. Parsing dan validasi
 * dipisahkan ke berkas ini supaya bisa diuji tanpa merender layar.
 */
export interface DraftLine {
  key: string;
  grade: MaterialGrade | null;
  weightKg: string;
  pricePerKg: string;
  deductionKg: string;
  deductionAmount: string;
  deductionReason: string;
}

export interface DraftReceipt {
  partnerName: string;
  region: string;
  scaleTeraNo: string;
  notes: string;
  lines: DraftLine[];
}

export function emptyLine(key: string): DraftLine {
  return {
    key,
    grade: null,
    weightKg: '',
    pricePerKg: '',
    deductionKg: '',
    deductionAmount: '',
    deductionReason: '',
  };
}

/** Menerima "12,5" maupun "12.5"; string kosong dianggap 0. */
export function parseNumber(raw: string): number {
  const normalized = raw.replace(',', '.').trim();
  if (normalized === '') return 0;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : NaN;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface LinePreview {
  netWeightKg: number;
  grossAmount: number;
  subtotal: number;
}

/**
 * Perhitungan ini sengaja mencerminkan persis rumus di sisi server, supaya
 * angka yang dilihat pemulung saat mengisi sama dengan angka pada bukti yang
 * terbit. Kalau keduanya berbeda, bukti timbang kehilangan kepercayaan.
 */
export function previewLine(line: DraftLine): LinePreview {
  const weight = parseNumber(line.weightKg);
  const deductionKg = parseNumber(line.deductionKg);
  const price = parseNumber(line.pricePerKg);
  const deductionAmount = parseNumber(line.deductionAmount);

  if ([weight, deductionKg, price, deductionAmount].some(Number.isNaN)) {
    return { netWeightKg: 0, grossAmount: 0, subtotal: 0 };
  }

  const netWeightKg = round2(Math.max(weight - deductionKg, 0));
  const grossAmount = Math.round(netWeightKg * price);
  return { netWeightKg, grossAmount, subtotal: grossAmount - deductionAmount };
}

export interface DraftTotals {
  totalWeightKg: number;
  totalDeductionKg: number;
  totalNetWeightKg: number;
  totalGrossAmount: number;
  totalDeductionAmount: number;
  totalNetAmount: number;
}

export function previewTotals(lines: DraftLine[]): DraftTotals {
  let totalWeightKg = 0;
  let totalDeductionKg = 0;
  let totalGrossAmount = 0;
  let totalDeductionAmount = 0;
  let totalNetAmount = 0;

  for (const line of lines) {
    const weight = parseNumber(line.weightKg);
    const deductionKg = parseNumber(line.deductionKg);
    const deductionAmount = parseNumber(line.deductionAmount);
    const preview = previewLine(line);
    if (!Number.isNaN(weight)) totalWeightKg += weight;
    if (!Number.isNaN(deductionKg)) totalDeductionKg += deductionKg;
    if (!Number.isNaN(deductionAmount)) totalDeductionAmount += deductionAmount;
    totalGrossAmount += preview.grossAmount;
    totalNetAmount += preview.subtotal;
  }

  return {
    totalWeightKg: round2(totalWeightKg),
    totalDeductionKg: round2(totalDeductionKg),
    totalNetWeightKg: round2(totalWeightKg - totalDeductionKg),
    totalGrossAmount,
    totalDeductionAmount,
    totalNetAmount,
  };
}

export interface DraftErrors {
  partnerName?: string;
  region?: string;
  /** Galat per baris, dipetakan menurut `DraftLine.key`. */
  lines: Record<string, string>;
}

export function validateDraft(draft: DraftReceipt): DraftErrors {
  const errors: DraftErrors = { lines: {} };

  if (draft.partnerName.trim().length < 3) {
    errors.partnerName = t.weighing.errors.partnerNameMin;
  }
  if (draft.region.trim().length < 3) {
    errors.region = t.weighing.errors.regionMin;
  }

  for (const line of draft.lines) {
    const weight = parseNumber(line.weightKg);
    const price = parseNumber(line.pricePerKg);
    const deductionKg = parseNumber(line.deductionKg);
    const deductionAmount = parseNumber(line.deductionAmount);

    if (!line.grade) {
      errors.lines[line.key] = t.weighing.errors.gradeRequired;
    } else if (Number.isNaN(weight) || weight <= 0) {
      errors.lines[line.key] = t.weighing.errors.weightPositive;
    } else if (Number.isNaN(price) || price < 0) {
      errors.lines[line.key] = t.weighing.errors.priceInvalid;
    } else if (Number.isNaN(deductionKg) || deductionKg < 0) {
      errors.lines[line.key] = t.weighing.errors.deductionKgInvalid;
    } else if (deductionKg > weight) {
      errors.lines[line.key] = t.weighing.errors.deductionKgExceedsWeight;
    } else if (Number.isNaN(deductionAmount) || deductionAmount < 0) {
      errors.lines[line.key] = t.weighing.errors.deductionAmountInvalid;
    } else if ((deductionKg > 0 || deductionAmount > 0) && line.deductionReason.trim() === '') {
      errors.lines[line.key] = t.weighing.errors.deductionReasonRequired;
    } else {
      const { subtotal } = previewLine(line);
      if (subtotal < 0) {
        errors.lines[line.key] = t.weighing.errors.negativeSubtotal;
      }
    }
  }

  return errors;
}

export function hasErrors(errors: DraftErrors): boolean {
  return Boolean(errors.partnerName || errors.region) || Object.keys(errors.lines).length > 0;
}

/**
 * Menyusun payload API dari isian formulir.
 *
 * `walkIn` diturunkan, bukan diminta terpisah: server menolak bukti tanpa
 * `pickupRequestId` yang tidak menyatakan `walkIn: true`, jadi menyimpan kedua
 * nilai itu sebagai state terpisah hanya membuka peluang keduanya bertentangan.
 * Satu-satunya sumber kebenaran adalah ada-tidaknya permintaan penjemputan.
 */
export function toCreateRequest(
  draft: DraftReceipt,
  sellerId: string,
  pickupRequestId?: string,
): CreateWeighingReceiptRequest {
  return {
    sellerId,
    ...(pickupRequestId ? { pickupRequestId } : { walkIn: true }),
    partnerName: draft.partnerName.trim(),
    region: draft.region.trim(),
    ...(draft.scaleTeraNo.trim() ? { scaleTeraNo: draft.scaleTeraNo.trim() } : {}),
    ...(draft.notes.trim() ? { notes: draft.notes.trim() } : {}),
    lines: draft.lines.map((line) => {
      const deductionKg = parseNumber(line.deductionKg);
      const deductionAmount = parseNumber(line.deductionAmount);
      return {
        grade: line.grade as MaterialGrade,
        weightKg: parseNumber(line.weightKg),
        pricePerKg: Math.round(parseNumber(line.pricePerKg)),
        ...(deductionKg > 0 ? { deductionKg } : {}),
        ...(deductionAmount > 0 ? { deductionAmount: Math.round(deductionAmount) } : {}),
        ...(deductionKg > 0 || deductionAmount > 0
          ? { deductionReason: line.deductionReason.trim() }
          : {}),
      };
    }),
  };
}
