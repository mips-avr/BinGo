/**
 * Bahasa Indonesia — bahasa default BinGo.
 *
 * Konvensi penamaan kunci: `<domain>.<konteks>.<aksi|label>`.
 * Hindari penggabungan kalimat dari potongan terpisah; pakai placeholder
 * `{name}` untuk interpolasi agar tata bahasa tetap natural.
 */
export interface TranslationDict {
  common: {
    appName: string;
    tagline: string;
    loading: string;
    save: string;
    cancel: string;
    retry: string;
    error: string;
    success: string;
  };
  auth: {
    login: string;
    register: string;
    logout: string;
    phone: string;
    password: string;
    name: string;
    nik: string;
    chooseRole: string;
    role: {
      CITIZEN: string;
      WASTE_AGENT: string;
      MSME: string;
    };
  };
  pickup: {
    title: string;
    create: string;
    nearby: string;
    accept: string;
    complete: string;
    cancel: string;
    status: {
      PENDING: string;
      ACCEPTED: string;
      IN_PROGRESS: string;
      COMPLETED: string;
      CANCELLED: string;
    };
  };
  report: {
    title: string;
    create: string;
    status: {
      DILAPORKAN: string;
      DIVERIFIKASI: string;
      SELESAI: string;
    };
  };
  marketplace: {
    title: string;
    cart: string;
    checkout: string;
    addToCart: string;
    minOrder: string;
    stock: string;
  };
  points: {
    label: string;
    earned: string;
  };
  scanner: {
    title: string;
    instruction: string;
    result: {
      material: string;
      disposal: string;
      points: string;
    };
  };
}

export const id: TranslationDict = {
  common: {
    appName: 'BinGo',
    tagline: 'Aksi kecil untuk Indonesia yang lebih bersih',
    loading: 'Memuat...',
    save: 'Simpan',
    cancel: 'Batal',
    retry: 'Coba lagi',
    error: 'Terjadi kesalahan',
    success: 'Berhasil',
  },
  auth: {
    login: 'Masuk',
    register: 'Daftar',
    logout: 'Keluar',
    phone: 'Nomor Telepon',
    password: 'Kata Sandi',
    name: 'Nama Lengkap',
    nik: 'NIK',
    chooseRole: 'Pilih peran Anda',
    role: {
      CITIZEN: 'Warga',
      WASTE_AGENT: 'Pemulung',
      MSME: 'UMKM',
    },
  },
  pickup: {
    title: 'Permintaan Penjemputan',
    create: 'Buat Permintaan',
    nearby: 'Permintaan Terdekat',
    accept: 'Terima',
    complete: 'Selesaikan',
    cancel: 'Batalkan',
    status: {
      PENDING: 'Menunggu',
      ACCEPTED: 'Diterima',
      IN_PROGRESS: 'Dalam Perjalanan',
      COMPLETED: 'Selesai',
      CANCELLED: 'Dibatalkan',
    },
  },
  report: {
    title: 'Laporan Pembuangan Ilegal',
    create: 'Lapor',
    status: {
      DILAPORKAN: 'Dilaporkan',
      DIVERIFIKASI: 'Diverifikasi',
      SELESAI: 'Selesai',
    },
  },
  marketplace: {
    title: 'WasteMart',
    cart: 'Keranjang',
    checkout: 'Bayar',
    addToCart: 'Tambah ke Keranjang',
    minOrder: 'Minimal pesanan',
    stock: 'Stok',
  },
  points: {
    label: 'Poin TrashLink',
    earned: 'Anda mendapatkan {amount} poin',
  },
  scanner: {
    title: 'TrashScan',
    instruction: 'Arahkan kamera ke simbol daur ulang pada kemasan',
    result: {
      material: 'Jenis material',
      disposal: 'Cara pembuangan',
      points: 'Nilai poin',
    },
  },
};
