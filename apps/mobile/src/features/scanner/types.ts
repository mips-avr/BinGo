import type { MaterialGrade, MaterialType } from '@bingo/shared-types';

/**
 * Dari mana jenis material pada layar hasil berasal.
 *
 * Ini bukan detail teknis — ini yang wajib dibaca pengguna. Kode resin yang
 * ditunjuk sendiri oleh pengguna adalah fakta; dugaan warna oleh ponsel adalah
 * tebakan. Menampilkan keduanya dengan kalimat yang sama ("Keyakinan model:
 * 98%", seperti versi sebelumnya) menyesatkan, apalagi ketika 98% itu justru
 * muncul untuk masukan yang diketik pengguna sendiri.
 */
export type ScanSource =
  /** Tahap 1 — pengguna menunjuk kode daur ulang 1–7 pada kemasan. */
  | 'resin-code'
  /** Tahap 2 — klasifikasi TFLite dari foto. Saran, bukan vonis. */
  | 'visual-estimate'
  /** Pengguna memilih sendiri jenis materialnya di layar hasil. */
  | 'manual';

export interface ScanResult {
  /**
   * Jenis material. Ketika `confident` bernilai `false`, nilai ini hanyalah
   * dugaan terbaik dan TIDAK boleh ditampilkan sebagai keputusan.
   */
  materialType: MaterialType;
  /** Grade hanya terisi bila kelas model memang membedakannya, saat ini kardus. */
  materialGrade: MaterialGrade | null;
  source: ScanSource;
  /**
   * `false` berarti sistem menolak menyimpulkan. Layar hasil wajib meminta
   * pengguna memotret simbol daur ulang atau memilih material secara manual,
   * dan tidak boleh memberi instruksi pembuangan.
   */
  confident: boolean;
  /**
   * Probabilitas kelas teratas setelah temperature scaling (0–1).
   * `null` untuk sumber selain 'visual-estimate' — kode resin dan pilihan
   * manual bukan keluaran model, jadi tidak punya skor sama sekali.
   */
  visualScore: number | null;
  /** Kode resin 1–7 bila sumbernya pembacaan kode; selain itu `null`. */
  resinCode: number | null;
  /** Petunjuk pembuangan. `null` ketika sistem tidak yakin. */
  disposalTip: string | null;
  pointsHint: number;
}
