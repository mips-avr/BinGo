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
    back: string;
    submit: string;
    empty: string;
    search: string;
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
  tabs: {
    home: string;
    scanner: string;
    pickups: string;
    reports: string;
    marketplace: string;
    profile: string;
  };
  home: {
    greeting: string;
    quickActions: string;
    recent: string;
    requestPickup: string;
    reportDump: string;
    scanTrash: string;
    browseMart: string;
  };
  pickup: {
    title: string;
    listTitle: string;
    create: string;
    nearby: string;
    accept: string;
    complete: string;
    cancel: string;
    address: string;
    addressPlaceholder: string;
    material: string;
    weight: string;
    weightPlaceholder: string;
    notes: string;
    notesPlaceholder: string;
    locationLabel: string;
    locationHint: string;
    locationPick: string;
    locationDetected: string;
    createSuccess: string;
    cancelConfirm: string;
    detailTitle: string;
    emptyTitle: string;
    emptyMessage: string;
    status: {
      PENDING: string;
      ACCEPTED: string;
      IN_PROGRESS: string;
      COMPLETED: string;
      CANCELLED: string;
    };
    material_label: {
      PET: string;
      HDPE: string;
      PVC: string;
      LDPE: string;
      PP: string;
      PS: string;
      OTHER_PLASTIC: string;
      PAPER: string;
      METAL: string;
      GLASS: string;
      ORGANIC: string;
      MIXED: string;
    };
  };
  report: {
    title: string;
    feedTitle: string;
    create: string;
    photo: string;
    photoTake: string;
    photoPick: string;
    photoMissing: string;
    description: string;
    descriptionPlaceholder: string;
    locationDetected: string;
    submit: string;
    createSuccess: string;
    verify: string;
    verifyOwn: string;
    verifyCount: string;
    detailTitle: string;
    emptyTitle: string;
    emptyMessage: string;
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
    searchPlaceholder: string;
    citizenNotice: string;
    emptyTitle: string;
    emptyMessage: string;
  };
  points: {
    label: string;
    earned: string;
    short: string;
  };
  profile: {
    title: string;
    accountInfo: string;
    contact: string;
    logoutConfirmTitle: string;
    logoutConfirmMessage: string;
  };
  agent: {
    tabs: {
      home: string;
      nearby: string;
      jobs: string;
      reports: string;
      profile: string;
    };
    home: {
      greeting: string;
      subtitle: string;
      nearbyCount: string;
      activeJobs: string;
      viewNearby: string;
      viewJobs: string;
      reportsToResolve: string;
    };
    nearby: {
      title: string;
      radiusLabel: string;
      refreshLocation: string;
      emptyTitle: string;
      emptyMessage: string;
      acceptSuccess: string;
    };
    jobs: {
      title: string;
      emptyTitle: string;
      emptyMessage: string;
      completeConfirm: string;
      completeSuccess: string;
    };
    reports: {
      toResolveTitle: string;
      resolve: string;
      resolveSuccess: string;
      filterVerified: string;
    };
  };
  scanner: {
    title: string;
    instruction: string;
    capture: string;
    analyzing: string;
    manualCode: string;
    manualCodeHint: string;
    permissionDenied: string;
    resultTitle: string;
    confidence: string;
    scanAgain: string;
    useForPickup: string;
    engineHeuristic: string;
    engineTflite: string;
    result: {
      material: string;
      disposal: string;
      points: string;
    };
  };
  msme: {
    tabs: {
      shop: string;
      cart: string;
      orders: string;
      profile: string;
    };
    cart: {
      title: string;
      emptyTitle: string;
      emptyMessage: string;
      total: string;
      checkout: string;
      checkoutSuccess: string;
      addToCart: string;
      qty: string;
      remove: string;
      minOrderWarning: string;
    };
    orders: {
      title: string;
      emptyTitle: string;
      emptyMessage: string;
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
    back: 'Kembali',
    submit: 'Kirim',
    empty: 'Belum ada data',
    search: 'Cari',
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
  tabs: {
    home: 'Beranda',
    scanner: 'TrashScan',
    pickups: 'Pickup',
    reports: 'Lapor',
    marketplace: 'WasteMart',
    profile: 'Profil',
  },
  home: {
    greeting: 'Halo, {name}!',
    quickActions: 'Aksi cepat',
    recent: 'Aktivitas terbaru',
    requestPickup: 'Minta penjemputan',
    reportDump: 'Lapor pembuangan ilegal',
    scanTrash: 'Pindai kemasan (TrashScan)',
    browseMart: 'Jelajah WasteMart',
  },
  pickup: {
    title: 'Permintaan Penjemputan',
    listTitle: 'Permintaan saya',
    create: 'Buat Permintaan',
    nearby: 'Permintaan Terdekat',
    accept: 'Terima',
    complete: 'Selesaikan',
    cancel: 'Batalkan',
    address: 'Alamat lengkap',
    addressPlaceholder: 'Mis. Jl. Sudirman No. 1, Jakarta Pusat',
    material: 'Jenis material',
    weight: 'Estimasi berat (kg)',
    weightPlaceholder: '2.5',
    notes: 'Catatan untuk pemulung (opsional)',
    notesPlaceholder: 'Patokan rumah, jam yang dipilih, dll.',
    locationLabel: 'Titik penjemputan',
    locationHint: 'BinGo akan mengarahkan pemulung ke koordinat ini.',
    locationPick: 'Gunakan lokasi saya',
    locationDetected: 'Lokasi terdeteksi',
    createSuccess: 'Permintaan terkirim. Pemulung akan segera melihatnya.',
    cancelConfirm: 'Batalkan permintaan ini?',
    detailTitle: 'Detail Permintaan',
    emptyTitle: 'Belum ada permintaan',
    emptyMessage: 'Buat permintaan pertama Anda untuk menjadwalkan penjemputan sampah.',
    status: {
      PENDING: 'Menunggu',
      ACCEPTED: 'Diterima',
      IN_PROGRESS: 'Dalam Perjalanan',
      COMPLETED: 'Selesai',
      CANCELLED: 'Dibatalkan',
    },
    material_label: {
      PET: 'PET (Botol minuman)',
      HDPE: 'HDPE (Tutup botol, jerigen)',
      PVC: 'PVC (Pipa, mainan keras)',
      LDPE: 'LDPE (Kantong plastik)',
      PP: 'PP (Sedotan, kemasan makanan)',
      PS: 'PS (Styrofoam)',
      OTHER_PLASTIC: 'Plastik lainnya',
      PAPER: 'Kertas / kardus',
      METAL: 'Kaleng / logam',
      GLASS: 'Kaca / botol kaca',
      ORGANIC: 'Sampah organik',
      MIXED: 'Campuran',
    },
  },
  report: {
    title: 'Laporan Pembuangan Ilegal',
    feedTitle: 'Laporan komunitas',
    create: 'Lapor',
    photo: 'Foto bukti',
    photoTake: 'Foto kamera',
    photoPick: 'Pilih dari galeri',
    photoMissing: 'Foto bukti wajib dilampirkan',
    description: 'Deskripsi (opsional)',
    descriptionPlaceholder: 'Ceritakan apa yang Anda lihat di lokasi.',
    locationDetected: 'Koordinat otomatis ditangkap',
    submit: 'Kirim Laporan',
    createSuccess: 'Terima kasih! Laporan Anda akan ditinjau warga lain.',
    verify: 'Saya juga melihat ini',
    verifyOwn: 'Anda tidak bisa memverifikasi laporan sendiri',
    verifyCount: '{count} verifikasi',
    detailTitle: 'Detail Laporan',
    emptyTitle: 'Belum ada laporan',
    emptyMessage: 'Bantu lingkungan Anda — laporkan tumpukan sampah yang Anda temukan.',
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
    searchPlaceholder: 'Cari produk atau supplier',
    citizenNotice: 'Pembelian khusus akun UMKM. Anda dapat menjelajah katalog.',
    emptyTitle: 'Belum ada produk',
    emptyMessage: 'Coba kata kunci lain.',
  },
  points: {
    label: 'Poin TrashLink',
    earned: 'Anda mendapatkan {amount} poin',
    short: 'poin',
  },
  profile: {
    title: 'Profil',
    accountInfo: 'Informasi akun',
    contact: 'Kontak',
    logoutConfirmTitle: 'Keluar dari akun?',
    logoutConfirmMessage: 'Anda perlu memasukkan ulang nomor telepon & kata sandi untuk masuk kembali.',
  },
  agent: {
    tabs: {
      home: 'Dashboard',
      nearby: 'Terdekat',
      jobs: 'Pekerjaan',
      reports: 'Laporan',
      profile: 'Profil',
    },
    home: {
      greeting: 'Halo, {name}!',
      subtitle: 'Siap menjemput sampah hari ini?',
      nearbyCount: '{count} permintaan terdekat',
      activeJobs: '{count} pekerjaan aktif',
      viewNearby: 'Lihat permintaan terdekat',
      viewJobs: 'Lihat pekerjaan saya',
      reportsToResolve: '{count} laporan perlu ditangani',
    },
    nearby: {
      title: 'Permintaan Terdekat',
      radiusLabel: 'Radius pencarian',
      refreshLocation: 'Perbarui lokasi saya',
      emptyTitle: 'Tidak ada permintaan di sekitar',
      emptyMessage: 'Perbesar radius atau pindah ke area lain, lalu tarik untuk memuat ulang.',
      acceptSuccess: 'Pekerjaan diterima. Cek tab Pekerjaan untuk detail.',
    },
    jobs: {
      title: 'Pekerjaan Saya',
      emptyTitle: 'Belum ada pekerjaan',
      emptyMessage: 'Terima permintaan dari tab Terdekat untuk mulai bekerja.',
      completeConfirm: 'Tandai penjemputan ini selesai?',
      completeSuccess: 'Penjemputan selesai. Warga mendapat poin TrashLink.',
    },
    reports: {
      toResolveTitle: 'Laporan diverifikasi',
      resolve: 'Tandai selesai ditangani',
      resolveSuccess: 'Laporan ditandai selesai.',
      filterVerified: 'Menampilkan laporan yang sudah diverifikasi komunitas',
    },
  },
  scanner: {
    title: 'TrashScan',
    instruction: 'Arahkan kamera ke simbol daur ulang pada kemasan',
    capture: 'Pindai sekarang',
    analyzing: 'Menganalisis kemasan…',
    manualCode: 'Atau pilih kode daur ulang',
    manualCodeHint: 'Angka di dalam segitiga daur ulang (1–7)',
    permissionDenied: 'Izin kamera ditolak. Aktifkan di pengaturan perangkat.',
    resultTitle: 'Hasil pemindaian',
    confidence: 'Keyakinan model: {percent}%',
    scanAgain: 'Pindai lagi',
    useForPickup: 'Buat permintaan pickup',
    engineHeuristic: 'Mode edukasi (heuristik warna)',
    engineTflite: 'TensorFlow Lite',
    result: {
      material: 'Jenis material',
      disposal: 'Cara pembuangan',
      points: 'Nilai poin edukasi',
    },
  },
  msme: {
    tabs: {
      shop: 'Belanja',
      cart: 'Keranjang',
      orders: 'Pesanan',
      profile: 'Profil',
    },
    cart: {
      title: 'Keranjang WasteMart',
      emptyTitle: 'Keranjang kosong',
      emptyMessage: 'Tambahkan produk ramah lingkungan dari tab Belanja.',
      total: 'Total',
      checkout: 'Bayar sekarang',
      checkoutSuccess: 'Pesanan berhasil. Stok telah dikurangi.',
      addToCart: 'Tambah ke keranjang',
      qty: 'Jumlah',
      remove: 'Hapus',
      minOrderWarning: 'Minimal pesanan {min} unit',
    },
    orders: {
      title: 'Riwayat pesanan',
      emptyTitle: 'Belum ada pesanan',
      emptyMessage: 'Checkout produk dari keranjang untuk melihat riwayat di sini.',
    },
  },
};
