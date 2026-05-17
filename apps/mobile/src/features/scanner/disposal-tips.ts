import type { MaterialType } from '@bingo/shared-types';

/** Poin edukatif (bukan saldo TrashLink) — nilai acuan untuk UI TrashScan. */
export const SCAN_POINTS_HINT: Record<MaterialType, number> = {
  PET: 5,
  HDPE: 5,
  PVC: 3,
  LDPE: 4,
  PP: 4,
  PS: 3,
  OTHER_PLASTIC: 3,
  PAPER: 4,
  METAL: 6,
  GLASS: 5,
  ORGANIC: 2,
  MIXED: 1,
};

/** Panduan pembuangan ramah lingkungan per jenis material. */
export const DISPOSAL_TIPS_ID: Record<MaterialType, string> = {
  PET:
    'Cuci dan keringkan botol PET, buang tutup terpisah bila jenis plastik berbeda. Setorkan ke bank sampah atau pemulung.',
  HDPE:
    'Kemasan HDPE (jerigen, tutup botol) bisa didaur ulang. Bilas sisa isi, jangan campur dengan sampah organik.',
  PVC:
    'PVC jarang didaur ulang di fasilitas rumahan. Pisahkan dan serahkan ke titik pengumpulan khusus plastik keras.',
  LDPE:
    'Kantong plastik LDPE bisa dikumpulkan terpisah. Gunakan ulang jika masih bersih, atau setorkan ke bank sampah.',
  PP:
    'Sedotan dan tutup PP kecil — kumpulkan dalam satu wadah agar tidak tercecer. Setorkan ke pemulung plastik.',
  PS:
    'Styrofoam (PS) volume besar — kompres atau serahkan ke pengumpul khusus. Hindari dibakar.',
  OTHER_PLASTIC:
    'Plastik campuran: pisahkan sebisa mungkin menurut jenis. Serahkan ke bank sampah yang menerima plastik.',
  PAPER:
    'Kertas/kardus kering dan bersih. Jangan campur dengan makanan basah. Lipat untuk menghemat volume.',
  METAL:
    'Kaleng aluminium/besi — bilas, gulung jika perlu. Logam memiliki nilai jual tinggi untuk pemulung.',
  GLASS:
    'Botol kaca utuh tanpa retak. Buang tutup terpisah. Hindari mencampur kaca pecahan dengan plastik.',
  ORGANIC:
    'Sampah organik: kompos di rumah atau tempat pengomposan RT. Jangan masukkan ke plastik sekali pakai.',
  MIXED:
    'Sampah campuran sulit didaur ulang. Pisahkan di sumber (plastik, kertas, organik) untuk dampak terbaik.',
};
