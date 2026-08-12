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
    viewAll: string;
    explore: string;
    redeemPoints: string;
    ok: string;
    share: string;
    close: string;
    unit: string;
    description: string;
    noDescription: string;
    createdAt: string;
    errorTitle: string;
    errorMessage: string;
    loadingLabel: string;
    notFoundTitle: string;
    notFoundMessage: string;
    backToHome: string;
  };
  auth: {
    login: string;
    register: string;
    logout: string;
    phone: string;
    phoneViaCard: string;
    password: string;
    name: string;
    /**
     * Catatan: tidak ada kunci NIK di sini, dan itu disengaja. BinGo tidak
     * mengumpulkan Nomor Induk Kependudukan; verifikasi pemulung memakai
     * penjaminan mitra (lihat `agent.verification`).
     */
    noIdNumberNotice: string;
    chooseRole: string;
    roleIntro: string;
    changeRole: string;
    noAccount: string;
    haveAccount: string;
    loginFailed: string;
    registerFailed: string;
    role: {
      CITIZEN: string;
      WASTE_AGENT: string;
      MSME: string;
    };
    roleDescription: {
      CITIZEN: string;
      WASTE_AGENT: string;
      MSME: string;
    };
    errors: {
      nameMin: string;
      phoneInvalid: string;
      phoneInvalidExample: string;
      passwordMin: string;
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
    pointsTitle: string;
    openProfile: string;
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
    locationFailed: string;
    locationPermissionDenied: string;
    errors: {
      locationRequired: string;
      addressMin: string;
      materialRequired: string;
      weightPositive: string;
      weightMax: string;
    };
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
  collectionSchedule: {
    title: string;
    open: string;
    emptyTitle: string;
    emptyMessage: string;
    source: string;
    verifiedAt: string;
    preparation: string;
    timeRange: string;
    timeNotListed: string;
    daysNotListed: string;
    serviceMode: {
      DOOR_TO_DOOR: string;
      COLLECTION_POINT: string;
    };
    publisherType: {
      DLH: string;
      SUDIN_LH: string;
      KELURAHAN_RT_RW: string;
      BANK_SAMPAH: string;
      TPS3R: string;
      OPERATOR: string;
    };
    day: {
      MONDAY: string;
      TUESDAY: string;
      WEDNESDAY: string;
      THURSDAY: string;
      FRIDAY: string;
      SATURDAY: string;
      SUNDAY: string;
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
    cameraUnavailable: string;
    cameraPermissionDenied: string;
    galleryUnavailable: string;
    galleryPermissionDenied: string;
    locationPending: string;
    status: {
      DILAPORKAN: string;
      DIVERIFIKASI: string;
      SELESAI: string;
    };
  };
  transaction: {
    status: {
      PENDING: string;
      PAID: string;
      SHIPPED: string;
      COMPLETED: string;
      CANCELLED: string;
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
      statsTitle: string;
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
      /** Radar geospasial */
      radarLabel: string;
      radarSummary: string;
      radarEmptySummary: string;
      radarHint: string;
      radarLocating: string;
      markerLabel: string;
      ringLabel: string;
      centerLabel: string;
      legendTitle: string;
      legendShape: string;
      legendSize: string;
      legendPosition: string;
      listTitle: string;
      selectedBadge: string;
      filterMaterial: string;
      filterAll: string;
      filterMinWeight: string;
      filterAnyWeight: string;
      filterWeightOption: string;
      ageAndCitizen: string;
      /** Nama arah mata angin yang dibacakan pembaca layar. */
      direction: {
        N: string;
        NE: string;
        E: string;
        SE: string;
        S: string;
        SW: string;
        W: string;
        NW: string;
      };
      /** Huruf pendek pada tanda arah radar. */
      compass: {
        N: string;
        E: string;
        S: string;
        W: string;
      };
    };
    jobs: {
      title: string;
      emptyTitle: string;
      emptyMessage: string;
      completeConfirm: string;
      completeSuccess: string;
      start: string;
      startSuccess: string;
      release: string;
      releaseConfirmTitle: string;
      releaseConfirmMessage: string;
      releaseSuccess: string;
      openMap: string;
      openMapFailed: string;
    };
    reports: {
      toResolveTitle: string;
      resolve: string;
      resolveSuccess: string;
      filterVerified: string;
      emptyTitle: string;
      emptyMessage: string;
    };
    /** Verifikasi berjenjang pemulung — pengganti verifikasi berbasis NIK. */
    verification: {
      badgeLabel: string;
      sectionTitle: string;
      levelName: {
        '0': string;
        '1': string;
        '2': string;
      };
      levelSummary: {
        '0': string;
        '1': string;
        '2': string;
      };
      noIdNumber: string;
      /** Layar penjelasan saat pemulung Tingkat 0 menekan "Ambil". */
      gateTitle: string;
      gateBody: string;
      gateSteps: string;
      gateAllowedTitle: string;
      gateAllowed: string;
      gateCta: string;
      /** Penjelasan saat pekerjaan bernilai tinggi ditekan Tingkat 1. */
      highValueTitle: string;
      highValueBody: string;
      highValueBadge: string;
      /** Syarat Tingkat 2. */
      criteriaTitle: string;
      criteriaSecondInstitution: string;
      criteriaDisputeless: string;
      criteriaPeer: string;
      partnerTypes: {
        BANK_SAMPAH: string;
        LAPAK: string;
        TPS3R: string;
        KSM_PERSAMPAHAN: string;
        RT_RW: string;
      };
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
    captureFailed: string;
    captureFailedBody: string;
    resultTitle: string;
    scanAgain: string;
    useForPickup: string;
    /** Dua tahap pipeline — dijelaskan apa adanya ke pengguna. */
    stageTitle: string;
    stageOne: string;
    stageTwo: string;
    noModelNotice: string;
    /** Asal hasil (provenance). */
    sourceTitle: string;
    sourceResin: string;
    sourceResinDetail: string;
    sourceVisual: string;
    sourceVisualDetail: string;
    sourceManual: string;
    sourceManualDetail: string;
    visualSeparation: string;
    /** Perilaku menahan diri. */
    notConfidentTitle: string;
    notConfidentBody: string;
    notConfidentGuess: string;
    disposalHeld: string;
    /** Koreksi manual. */
    notThis: string;
    chooseManual: string;
    chooseManualTitle: string;
    correctedTitle: string;
    correctedBody: string;
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
      qtyIncrease: string;
      qtyDecrease: string;
      remove: string;
      removeItem: string;
      minOrderWarning: string;
      stockWarning: string;
    };
    orders: {
      title: string;
      emptyTitle: string;
      emptyMessage: string;
    };
  };
  weighing: {
    tabTitle: string;
    receiptTitle: string;
    receiptListTitle: string;
    newTitle: string;
    emptyTitle: string;
    emptyMessage: string;
    partnerName: string;
    partnerNamePlaceholder: string;
    region: string;
    regionPlaceholder: string;
    scaleTeraNo: string;
    scaleTeraNoHint: string;
    scaleVerified: string;
    scaleUnverified: string;
    notes: string;
    lines: string;
    lineCount: string;
    addLine: string;
    removeLine: string;
    grade: string;
    gradeConditionsTitle: string;
    gradeNotSellable: string;
    sellerUnknown: string;
    weightKg: string;
    pricePerKg: string;
    deductionKg: string;
    deductionAmount: string;
    deductionReason: string;
    deductionReasonRequired: string;
    netWeight: string;
    grossAmount: string;
    subtotal: string;
    totalWeight: string;
    totalDeduction: string;
    totalNet: string;
    issue: string;
    issueSuccess: string;
    issuerUnknown: string;
    counterpartyUnknown: string;
    seller: string;
    issuedBy: string;
    issuedAt: string;
    viewReceipt: string;
    noDeduction: string;
    createFromJob: string;
    alreadyIssued: string;
    /** Setoran langsung tanpa penjemputan. */
    walkInTitle: string;
    walkInToggle: string;
    walkInBadge: string;
    walkInExplain: string;
    walkInSellerLabel: string;
    walkInSellerHint: string;
    walkInSellerRequired: string;
    fromPickupTitle: string;
    fromPickupBody: string;
    /** Berbagi bukti ke pihak kedua. */
    share: string;
    shareFailed: string;
    shareDialogTitle: string;
    shareHeader: string;
    shareFooter: string;
    /** Autocomplete wilayah. */
    regionSuggestTitle: string;
    regionSuggestHint: string;
    regionReceiptCount: string;
    regionUseMyLocation: string;
    regionLocating: string;
    regionFreeText: string;
    regionNoSuggestion: string;
    /** Papan harga: saringan & bagan. */
    gradeFilter: string;
    windowFilter: string;
    gradeFilterAll: string;
    spreadAxis: string;
    spreadNarrow: string;
    spreadWide: string;
    spreadSingle: string;
    bandAccessibility: string;
    publicNotice: string;
    citizenEntryTitle: string;
    citizenEntrySubtitle: string;
    methodologyExcluded: string;
    priceBoardTitle: string;
    priceBoardSubtitle: string;
    priceBoardRegion: string;
    priceBoardWindow: string;
    priceBoardEmptyTitle: string;
    priceBoardEmptyMessage: string;
    priceBoardRegionPromptTitle: string;
    priceBoardRegionPromptMessage: string;
    priceBoardInsufficient: string;
    priceBoardInsufficientHint: string;
    priceRange: string;
    median: string;
    sampleCount: string;
    partnerCount: string;
    lastReported: string;
    methodologyTitle: string;
    methodologyBody: string;
    errors: {
      partnerNameMin: string;
      regionMin: string;
      gradeRequired: string;
      weightPositive: string;
      priceInvalid: string;
      deductionKgInvalid: string;
      deductionKgExceedsWeight: string;
      deductionAmountInvalid: string;
      deductionReasonRequired: string;
      negativeSubtotal: string;
    };
  };
  /** Langkah lanjutan setelah TrashScan mengenali material. */
  scanNext: {
    ingubTitle: string;
    ingubSource: string;
    priceTitle: string;
    priceNeedsLocation: string;
    priceNeedsLocationDenied: string;
    priceRegionUnknown: string;
    priceRegionNote: string;
    priceInsufficient: string;
    priceSample: string;
    priceDisclaimer: string;
    priceGradeWarning: string;
    dropNeedsLocation: string;
  };
  /** Kartu Mitra — identitas fisik bagi penyetor yang tidak punya ponsel. */
  card: {
    title: string;
    subtitle: string;
    issueTitle: string;
    issueCta: string;
    holderName: string;
    holderNamePlaceholder: string;
    holderPhone: string;
    holderPhoneOptional: string;
    holderPhoneHelp: string;
    region: string;
    note: string;
    tapToRead: string;
    tapPrompt: string;
    tapCancel: string;
    reading: string;
    readOk: string;
    uidLabel: string;
    uidPending: string;
    manualEntry: string;
    manualEntryHint: string;
    cardNumber: string;
    cardNumberPlaceholder: string;
    lookupCta: string;
    lookupTitle: string;
    holder: string;
    issuedBy: string;
    issuedAt: string;
    lastUsed: string;
    neverUsed: string;
    receiptCount: string;
    totalWeight: string;
    totalNet: string;
    statusActive: string;
    statusSuspended: string;
    statusLost: string;
    markLost: string;
    reactivate: string;
    claimed: string;
    unclaimed: string;
    unclaimedHelp: string;
    listTitle: string;
    listEmpty: string;
    listEmptyHint: string;
    useForReceipt: string;
    nfcUnavailable: string;
    nfcUnavailableHelp: string;
    nfcDisabled: string;
    printHint: string;
    whyNoKtp: string;
  };
  /** Titik setor — direktori terkurasi, termasuk operator selain BinGo. */
  dropPoint: {
    title: string;
    nearbyTitle: string;
    empty: string;
    emptyHint: string;
    distanceKm: string;
    distanceM: string;
    accepts: string;
    minWeight: string;
    noMinWeight: string;
    rewardCash: string;
    rewardPoints: string;
    rewardNone: string;
    openExternal: string;
    externalWarning: string;
    verifiedAt: string;
    source: string;
    disclaimer: string;
    operatorNotice: string;
    loadError: string;
    useLocation: string;
    locating: string;
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
    viewAll: 'Lihat semua',
    explore: 'Jelajahi',
    redeemPoints: 'Tukar poin',
    ok: 'OK',
    share: 'Bagikan',
    close: 'Tutup',
    unit: 'unit',
    description: 'Deskripsi',
    noDescription: 'Tanpa deskripsi',
    createdAt: 'Dibuat',
    errorTitle: 'Gagal memuat data',
    errorMessage: 'Periksa koneksi internet Anda, lalu coba lagi.',
    loadingLabel: 'Sedang memuat',
    notFoundTitle: 'Halaman tidak ditemukan',
    notFoundMessage: 'Tautan yang Anda buka tidak tersedia atau sudah dipindahkan.',
    backToHome: 'Kembali ke beranda',
  },
  auth: {
    login: 'Masuk',
    register: 'Daftar',
    logout: 'Keluar',
    phone: 'Nomor Telepon',
    phoneViaCard: 'Terdaftar lewat Kartu Mitra',
    password: 'Kata Sandi',
    name: 'Nama Lengkap',
    noIdNumberNotice: 'Daftar dengan nama dan nomor telepon.',
    chooseRole: 'Pilih peran Anda',
    roleIntro: 'Pilih peran Anda untuk melanjutkan pendaftaran.',
    changeRole: 'Ganti peran',
    noAccount: 'Belum punya akun?',
    haveAccount: 'Sudah punya akun?',
    loginFailed: 'Gagal masuk',
    registerFailed: 'Gagal mendaftar',
    role: {
      CITIZEN: 'Warga',
      WASTE_AGENT: 'Pemulung',
      MSME: 'UMKM',
    },
    roleDescription: {
      CITIZEN: 'Pindai sampah, ajukan penjemputan, dan laporkan pembuangan ilegal.',
      WASTE_AGENT: 'Temukan permintaan penjemputan terdekat & kumpulkan pendapatan.',
      MSME: 'Akses katalog kemasan ramah lingkungan di WasteMart.',
    },
    errors: {
      nameMin: 'Nama minimal 2 karakter',
      phoneInvalid: 'Nomor telepon tidak valid',
      phoneInvalidExample: 'Nomor telepon tidak valid (contoh: 08123456789)',
      passwordMin: 'Kata sandi minimal 8 karakter',
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
    pointsTitle: 'Total poin Anda',
    openProfile: 'Buka profil',
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
    locationFailed: 'Gagal mengambil lokasi',
    locationPermissionDenied:
      'Izin lokasi ditolak. Aktifkan akses lokasi di pengaturan untuk menentukan titik pickup/laporan.',
    errors: {
      locationRequired: 'Tentukan titik penjemputan terlebih dahulu',
      addressMin: 'Alamat minimal 3 karakter',
      materialRequired: 'Pilih jenis material',
      weightPositive: 'Estimasi berat harus lebih dari 0',
      weightMax: 'Estimasi berat maksimal 9999,99 kg',
    },
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
  collectionSchedule: {
    title: 'Jadwal pengangkutan rutin',
    open: 'Jadwal rutin',
    emptyTitle: 'Jadwal belum tersedia',
    emptyMessage: 'Belum ada jadwal terverifikasi untuk wilayah ini.',
    source: 'Lihat sumber',
    verifiedAt: 'Sumber diperiksa {date}',
    preparation: 'Persiapan',
    timeRange: '{start} sampai {end}',
    timeNotListed: 'Waktu tidak dicantumkan',
    daysNotListed: 'Hari tidak dicantumkan',
    serviceMode: {
      DOOR_TO_DOOR: 'Diambil dari rumah',
      COLLECTION_POINT: 'Pengangkutan dari titik kumpul',
    },
    publisherType: {
      DLH: 'Dinas Lingkungan Hidup',
      SUDIN_LH: 'Suku Dinas Lingkungan Hidup',
      KELURAHAN_RT_RW: 'Kelurahan atau RT/RW',
      BANK_SAMPAH: 'Bank sampah',
      TPS3R: 'TPS3R',
      OPERATOR: 'Operator pengangkutan',
    },
    day: {
      MONDAY: 'Senin',
      TUESDAY: 'Selasa',
      WEDNESDAY: 'Rabu',
      THURSDAY: 'Kamis',
      FRIDAY: 'Jumat',
      SATURDAY: 'Sabtu',
      SUNDAY: 'Minggu',
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
    emptyMessage: 'Laporkan tumpukan sampah yang Anda temukan.',
    cameraUnavailable: 'Kamera tidak tersedia',
    cameraPermissionDenied:
      'Izin kamera ditolak. Aktifkan di pengaturan untuk memotret bukti laporan.',
    galleryUnavailable: 'Galeri tidak tersedia',
    galleryPermissionDenied: 'Izin galeri ditolak. Aktifkan di pengaturan untuk memilih foto.',
    locationPending: 'Tunggu hingga koordinat terdeteksi atau aktifkan izin lokasi',
    status: {
      DILAPORKAN: 'Dilaporkan',
      DIVERIFIKASI: 'Diverifikasi',
      SELESAI: 'Selesai',
    },
  },
  transaction: {
    status: {
      PENDING: 'Menunggu pembayaran',
      PAID: 'Sudah dibayar',
      SHIPPED: 'Dikirim',
      COMPLETED: 'Selesai',
      CANCELLED: 'Dibatalkan',
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
    logoutConfirmMessage:
      'Anda perlu memasukkan ulang nomor telepon & kata sandi untuk masuk kembali.',
  },
  agent: {
    tabs: {
      home: 'Beranda',
      nearby: 'Terdekat',
      jobs: 'Pekerjaan',
      reports: 'Laporan',
      profile: 'Profil',
    },
    home: {
      greeting: 'Halo, {name}!',
      subtitle: 'Siap menjemput sampah hari ini?',
      statsTitle: 'Ringkasan hari ini',
      nearbyCount: '{count} permintaan terdekat',
      activeJobs: '{count} pekerjaan aktif',
      viewNearby: 'Lihat permintaan terdekat',
      viewJobs: 'Lihat pekerjaan saya',
      reportsToResolve: '{count} laporan perlu ditangani',
    },
    nearby: {
      title: 'Radar Permintaan',
      radiusLabel: 'Radius pencarian',
      refreshLocation: 'Perbarui lokasi saya',
      emptyTitle: 'Tidak ada permintaan di sekitar',
      emptyMessage: 'Perbesar radius atau pindah ke area lain, lalu tarik untuk memuat ulang.',
      acceptSuccess: 'Pekerjaan diterima. Cek tab Pekerjaan untuk detail.',
      radarLabel: 'Radar permintaan penjemputan',
      radarSummary: '{count} permintaan dalam radius {radius} km',
      radarEmptySummary: 'Tidak ada permintaan dalam radius {radius} km',
      radarHint: 'Ketuk titik pada radar untuk menyorot kartunya di daftar bawah.',
      radarLocating: 'Mencari posisi Anda…',
      markerLabel: '{material}, {weight} kg, {distance}, arah {direction}',
      ringLabel: 'Cincin jarak {distance}',
      centerLabel: 'Posisi Anda',
      legendTitle: 'Cara membaca radar',
      legendShape: 'Huruf di dalam titik menunjukkan jenis material.',
      legendSize: 'Titik makin besar berarti estimasi beratnya makin banyak.',
      legendPosition: 'Jarak titik dari pusat = jarak sebenarnya. Arah titik = arah mata angin.',
      listTitle: 'Daftar permintaan',
      selectedBadge: 'Dipilih di radar',
      filterMaterial: 'Jenis material',
      filterAll: 'Semua jenis',
      filterMinWeight: 'Berat minimal',
      filterAnyWeight: 'Bebas',
      filterWeightOption: '≥ {weight} kg',
      ageAndCitizen: '{name} · {age}',
      direction: {
        N: 'utara',
        NE: 'timur laut',
        E: 'timur',
        SE: 'tenggara',
        S: 'selatan',
        SW: 'barat daya',
        W: 'barat',
        NW: 'barat laut',
      },
      compass: {
        N: 'U',
        E: 'T',
        S: 'S',
        W: 'B',
      },
    },
    jobs: {
      title: 'Pekerjaan Saya',
      emptyTitle: 'Belum ada pekerjaan',
      emptyMessage: 'Terima permintaan dari tab Terdekat untuk mulai bekerja.',
      completeConfirm: 'Tandai penjemputan ini selesai?',
      completeSuccess: 'Penjemputan selesai. Warga mendapat poin TrashLink.',
      start: 'Mulai berangkat',
      startSuccess: 'Status berubah menjadi Dalam Perjalanan. Warga dapat melihatnya.',
      release: 'Lepaskan pekerjaan',
      releaseConfirmTitle: 'Lepaskan pekerjaan ini?',
      releaseConfirmMessage:
        'Permintaan kembali berstatus Menunggu dan bisa diambil pemulung lain. Lebih baik dilepas sekarang daripada dibiarkan menggantung.',
      releaseSuccess: 'Pekerjaan dilepaskan. Permintaan kembali ke radar.',
      openMap: 'Buka di peta',
      openMapFailed: 'Tidak ada aplikasi peta yang dapat membuka koordinat ini.',
    },
    reports: {
      toResolveTitle: 'Laporan diverifikasi',
      resolve: 'Tandai selesai ditangani',
      resolveSuccess: 'Laporan ditandai selesai.',
      filterVerified: 'Menampilkan laporan yang sudah diverifikasi komunitas',
      emptyTitle: 'Tidak ada laporan menunggu',
      emptyMessage: 'Laporan yang sudah diverifikasi komunitas akan muncul di sini.',
    },
    verification: {
      badgeLabel: 'Tingkat {level}',
      sectionTitle: 'Verifikasi berjenjang',
      levelName: {
        '0': 'Terdaftar',
        '1': 'Dijamin Mitra',
        '2': 'Dijamin Ganda',
      },
      levelSummary: {
        '0': 'Anda dapat melihat papan harga dan peta permintaan. Untuk mengambil pekerjaan, perlu satu penjaminan mitra.',
        '1': 'Anda dapat menerima penjemputan dan menerbitkan bukti timbang.',
        '2': 'Anda dapat mengambil pekerjaan bernilai tinggi dan mendapat prioritas pada radar.',
      },
      noIdNumber: 'Verifikasi dilakukan melalui mitra penjamin.',
      gateTitle: 'Perlu satu penjaminan mitra',
      gateBody: 'Verifikasi Tingkat 1 diperlukan untuk mengambil pekerjaan ini.',
      gateSteps:
        'Minta verifikasi dari bank sampah, lapak, pengepul, TPS3R, KSM persampahan, atau RT/RW tempat Anda bekerja.',
      gateAllowedTitle: 'Akses Tingkat 0',
      gateAllowed: 'Anda tetap dapat melihat radar dan papan harga.',
      gateCta: 'Mengerti',
      highValueTitle: 'Pekerjaan bernilai tinggi',
      highValueBody:
        'Permintaan {weight} kg hanya dapat diambil pemulung Tingkat 2 (Dijamin Ganda). Anda sekarang Tingkat {level}.',
      highValueBadge: 'Nilai tinggi',
      criteriaTitle: 'Pilih dua syarat untuk Tingkat 2',
      criteriaSecondInstitution: 'Penjaminan kedua dari lembaga yang berbeda',
      criteriaDisputeless: '10 transaksi tanpa sengketa',
      criteriaPeer: '2 rekomendasi dari mitra Tingkat 2',
      partnerTypes: {
        BANK_SAMPAH: 'Bank sampah',
        LAPAK: 'Lapak / pengepul',
        TPS3R: 'TPS3R',
        KSM_PERSAMPAHAN: 'KSM persampahan',
        RT_RW: 'RT / RW',
      },
    },
  },
  scanner: {
    title: 'TrashScan',
    instruction: 'Cari segitiga daur ulang pada kemasan, lalu ketuk angkanya di bawah',
    capture: 'Pindai dengan kamera',
    analyzing: 'Membaca foto…',
    manualCode: 'Pilih kode daur ulang',
    manualCodeHint: 'Pilih angka 1 sampai 7 yang tercetak pada kemasan.',
    permissionDenied: 'Izin kamera ditolak. Aktifkan di pengaturan perangkat.',
    captureFailed: 'Foto tidak dapat dibaca',
    captureFailedBody: 'Potret ulang dengan cahaya cukup atau pilih kode daur ulang.',
    resultTitle: 'Hasil pemindaian',
    scanAgain: 'Pindai lagi',
    useForPickup: 'Buat permintaan pickup',
    stageTitle: 'TrashScan bekerja dua tahap',
    stageOne: 'Pilih kode resin yang tercetak pada kemasan.',
    stageTwo: 'Gunakan kamera jika kode tidak terlihat.',
    noModelNotice: 'Periksa hasil sebelum melanjutkan.',
    sourceTitle: 'Dasar hasil ini',
    sourceResin: 'Kode resin dibaca',
    sourceResinDetail: 'Anda menunjuk kode daur ulang {code} pada kemasan.',
    sourceVisual: 'Perkiraan visual',
    sourceVisualDetail: 'Hasil analisis foto.',
    sourceManual: 'Dipilih manual',
    sourceManualDetail: 'Anda sendiri yang menentukan jenis material ini.',
    visualSeparation: 'Skor keyakinan terkalibrasi: {percent}%',
    notConfidentTitle: 'Perlu konfirmasi',
    notConfidentBody: 'Pilih jenis material atau pindai ulang dengan cahaya yang lebih baik.',
    notConfidentGuess: 'Kemungkinan material: {material}',
    disposalHeld: 'Konfirmasi jenis material untuk melihat panduan.',
    notThis: 'Bukan ini?',
    chooseManual: 'Pilih jenis material sendiri',
    chooseManualTitle: 'Pilih jenis material',
    correctedTitle: 'Diperbarui',
    correctedBody: 'Jenis material kini ditandai sebagai pilihan Anda sendiri.',
    result: {
      material: 'Jenis material',
      disposal: 'Cara pembuangan',
      points: 'Poin',
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
      qtyIncrease: 'Tambah jumlah',
      qtyDecrease: 'Kurangi jumlah',
      remove: 'Hapus',
      removeItem: 'Hapus {name} dari keranjang',
      minOrderWarning: 'Minimal pesanan {min} unit',
      stockWarning: 'Stok tersedia hanya {stock} unit',
    },
    orders: {
      title: 'Riwayat pesanan',
      emptyTitle: 'Belum ada pesanan',
      emptyMessage: 'Checkout produk dari keranjang untuk melihat riwayat di sini.',
    },
  },
  weighing: {
    tabTitle: 'Harga',
    receiptTitle: 'Bukti timbang',
    receiptListTitle: 'Bukti timbang saya',
    newTitle: 'Terbitkan bukti timbang',
    emptyTitle: 'Belum ada bukti timbang',
    emptyMessage: 'Bukti timbang muncul di sini setelah material ditimbang dan diserahterimakan.',
    partnerName: 'Titik penerima',
    partnerNamePlaceholder: 'Nama bank sampah atau lapak',
    region: 'Wilayah',
    regionPlaceholder: 'Kecamatan, kota',
    scaleTeraNo: 'Nomor tera timbangan',
    scaleTeraNoHint:
      'Boleh dikosongkan, tetapi bukti tanpa nomor tera tidak dihitung ke papan harga.',
    scaleVerified: 'Timbangan bertera',
    scaleUnverified: 'Tanpa nomor tera',
    notes: 'Catatan',
    lines: 'Rincian material',
    lineCount: '{count} material',
    addLine: 'Tambah material',
    removeLine: 'Hapus',
    grade: 'Jenis material',
    gradeConditionsTitle: 'Syarat agar diterima pada grade ini',
    gradeNotSellable: 'tidak dibeli',
    sellerUnknown: 'Penyetor tidak diketahui. Buka layar ini dari detail pekerjaan.',
    weightKg: 'Berat timbang (kg)',
    pricePerKg: 'Harga per kg',
    deductionKg: 'Potongan berat (kg)',
    deductionAmount: 'Potongan rupiah',
    deductionReason: 'Alasan potongan',
    deductionReasonRequired: 'Setiap potongan wajib diberi alasan agar dapat diperiksa penyetor.',
    netWeight: 'Berat bersih',
    grossAmount: 'Nilai kotor',
    subtotal: 'Dibayar',
    totalWeight: 'Total berat timbang',
    totalDeduction: 'Total potongan',
    totalNet: 'Total dibayar',
    issue: 'Terbitkan bukti',
    issueSuccess: 'Bukti timbang berhasil diterbitkan.',
    issuerUnknown: 'Petugas mitra',
    counterpartyUnknown: 'Tidak tercatat',
    seller: 'Penyetor',
    issuedBy: 'Diterbitkan oleh',
    issuedAt: 'Waktu terbit',
    viewReceipt: 'Lihat bukti timbang',
    noDeduction: 'Tanpa potongan',
    createFromJob: 'Timbang & terbitkan bukti',
    alreadyIssued: 'Bukti timbang sudah diterbitkan untuk permintaan ini.',
    walkInTitle: 'Setoran langsung (walk-in)',
    walkInToggle: 'Setoran langsung, tanpa permintaan penjemputan',
    walkInBadge: 'Setoran langsung',
    walkInExplain: 'Bukti tersimpan sebagai transaksi setoran langsung.',
    walkInSellerLabel: 'ID akun penyetor',
    walkInSellerHint:
      'Minta penyetor menunjukkan ID akun BinGo miliknya. Bukti timbang selalu terikat pada dua pihak yang jelas.',
    walkInSellerRequired: 'ID penyetor wajib diisi untuk setoran langsung.',
    fromPickupTitle: 'Dari permintaan penjemputan',
    fromPickupBody: 'Bukti ini terhubung ke permintaan penjemputan.',
    share: 'Bagikan bukti',
    shareFailed: 'Gagal membagikan bukti timbang.',
    shareDialogTitle: 'Bagikan bukti timbang',
    shareHeader: 'BUKTI TIMBANG BinGo',
    shareFooter:
      'Bukti ini dibuat di aplikasi BinGo dan dipegang kedua pihak. Periksa ulang angkanya sebelum berpisah.',
    regionSuggestTitle: 'Wilayah yang sudah punya data',
    regionSuggestHint: 'Pilih dari daftar agar wilayah Anda cocok dengan data yang sudah tercatat.',
    regionReceiptCount: '{count} bukti',
    regionUseMyLocation: 'Pakai lokasi saya',
    regionLocating: 'Mencari wilayah Anda…',
    regionFreeText: 'Pakai ketikan saya: "{region}"',
    regionNoSuggestion:
      'Belum ada wilayah tercatat yang cocok. Anda tetap bisa memakai ketikan sendiri.',
    gradeFilter: 'Saring jenis material',
    windowFilter: 'Jendela waktu data',
    gradeFilterAll: 'Semua jenis',
    spreadAxis: 'Sebaran harga per kg',
    spreadNarrow: 'Harga di wilayah ini relatif seragam.',
    spreadWide: 'Harga antar titik penerima cukup beragam.',
    spreadSingle: 'Semua bukti melaporkan harga yang sama.',
    bandAccessibility: '{label}. Median {median} per kg. Sebaran {p25} sampai {p75} per kg.',
    publicNotice: 'Papan harga dapat dilihat tanpa akun.',
    citizenEntryTitle: 'Cek harga di wilayah Anda',
    citizenEntrySubtitle: 'Lihat rentang harga sebelum menyerahkan material ke pemulung.',
    methodologyExcluded: 'Rentang menggunakan bukti timbang yang memenuhi syarat.',
    priceBoardTitle: 'Papan harga',
    priceBoardSubtitle: 'Rentang harga yang dilaporkan titik penerima di wilayah ini',
    priceBoardRegion: 'Wilayah',
    priceBoardWindow: '{days} hari terakhir',
    priceBoardEmptyTitle: 'Data belum cukup untuk wilayah ini',
    priceBoardEmptyMessage:
      'Papan harga muncul setelah ada minimal 3 bukti timbang dari 2 titik penerima berbeda.',
    priceBoardRegionPromptTitle: 'Masukkan wilayah dulu',
    priceBoardRegionPromptMessage:
      'Ketik nama kecamatan atau kota (minimal 3 huruf) untuk melihat rentang harga di sana.',
    priceBoardInsufficient: 'Belum cukup data',
    priceBoardInsufficientHint:
      'Material berikut sudah ada datanya, tetapi belum memenuhi ambang minimum sehingga rentangnya belum ditampilkan.',
    priceRange: 'Rentang',
    median: 'Median',
    sampleCount: '{count} bukti timbang',
    partnerCount: '{count} titik penerima',
    lastReported: 'Terakhir dilaporkan {time}',
    methodologyTitle: 'Bagaimana angka ini dihitung',
    methodologyBody:
      'Rentang dihitung dari minimal 3 bukti timbang pada 2 titik penerima di wilayah dan periode yang dipilih.',
    errors: {
      partnerNameMin: 'Nama titik penerima minimal 3 karakter',
      regionMin: 'Wilayah minimal 3 karakter',
      gradeRequired: 'Pilih jenis material',
      weightPositive: 'Berat harus lebih dari 0',
      priceInvalid: 'Harga per kg tidak valid',
      deductionKgInvalid: 'Potongan berat tidak valid',
      deductionKgExceedsWeight: 'Potongan berat melebihi berat timbang',
      deductionAmountInvalid: 'Potongan rupiah tidak valid',
      deductionReasonRequired: 'Potongan wajib diberi alasan',
      negativeSubtotal: 'Potongan membuat pembayaran menjadi negatif',
    },
  },
  scanNext: {
    ingubTitle: 'Kategori pilah wajib',
    ingubSource:
      'Instruksi Gubernur DKI Jakarta No. 5 Tahun 2026, berlaku sejak 10 Mei 2026.',
    priceTitle: 'Perkiraan harga',
    priceNeedsLocation: 'Harga berbeda antarwilayah. Izinkan lokasi untuk melihat harga di sekitarmu.',
    priceNeedsLocationDenied:
      'Lokasi tidak diizinkan. Harga tetap bisa dilihat di tab Harga dengan mengetik nama wilayah.',
    priceRegionUnknown:
      'Lokasi didapat, tetapi nama wilayahnya tidak terbaca. Ketik wilayahmu untuk melihat harga.',
    priceRegionNote: 'Dari bukti timbang di {region}, 7 hari terakhir.',
    priceInsufficient:
      'Belum cukup bukti timbang di {region} untuk material ini. Angka hanya ditampilkan setelah ada cukup data dari beberapa mitra berbeda.',
    priceSample: '{samples} bukti · {partners} mitra',
    priceDisclaimer: 'Rentang harga dari bukti timbang 7 hari terakhir.',
    priceGradeWarning: 'Harga mengikuti grade dan kondisi material.',
    dropNeedsLocation: 'Izinkan lokasi untuk melihat titik setor terdekat.',
  },
  card: {
    title: 'Kartu Mitra',
    subtitle: 'Akun praktis bagi penyetor tanpa ponsel.',
    issueTitle: 'Terbitkan kartu baru',
    issueCta: 'Terbitkan kartu',
    holderName: 'Nama pemegang',
    holderNamePlaceholder: 'Nama panggilan sehari-hari sudah cukup',
    holderPhone: 'Nomor telepon',
    holderPhoneOptional: 'Nomor telepon (boleh dikosongkan)',
    holderPhoneHelp:
      'Kosongkan bila belum punya. Nomor bisa ditambahkan kapan saja, dan riwayatnya tetap ikut.',
    region: 'Wilayah',
    note: 'Catatan',
    tapToRead: 'Tempelkan kartu',
    tapPrompt: 'Dekatkan kartu ke bagian belakang ponsel',
    tapCancel: 'Batal membaca',
    reading: 'Membaca kartu…',
    readOk: 'Kartu terbaca',
    uidLabel: 'Chip',
    uidPending: 'Belum dipasangkan',
    manualEntry: 'Ketik nomor kartu',
    manualEntryHint:
      'Dipakai bila chip tidak terbaca atau ponsel tidak mendukung NFC. Nomornya tercetak di kartu.',
    cardNumber: 'Nomor kartu',
    cardNumberPlaceholder: 'BG-XXXX-XXXX',
    lookupCta: 'Cari pemegang',
    lookupTitle: 'Pemegang kartu',
    holder: 'Pemegang',
    issuedBy: 'Diterbitkan oleh',
    issuedAt: 'Tanggal terbit',
    lastUsed: 'Terakhir dipakai',
    neverUsed: 'Belum pernah dipakai',
    receiptCount: 'Bukti timbang',
    totalWeight: 'Total berat',
    totalNet: 'Total diterima',
    statusActive: 'Aktif',
    statusSuspended: 'Dibekukan',
    statusLost: 'Dilaporkan hilang',
    markLost: 'Laporkan hilang',
    reactivate: 'Aktifkan kembali',
    claimed: 'Sudah diklaim pemegang',
    unclaimed: 'Belum diklaim',
    unclaimedHelp:
      'Pemegang belum masuk lewat ponsel sendiri. Kartu tetap berlaku; akun yang sama bisa diklaim kapan pun.',
    listTitle: 'Kartu yang Anda terbitkan',
    listEmpty: 'Belum ada kartu diterbitkan',
    listEmptyHint:
      'Terbitkan kartu untuk penyetor yang rutin datang tetapi tidak punya ponsel, supaya setorannya tercatat atas namanya sendiri.',
    useForReceipt: 'Pakai untuk bukti timbang',
    nfcUnavailable: 'Ponsel ini tidak mendukung NFC',
    nfcUnavailableHelp: 'Masukkan nomor kartu secara manual.',
    nfcDisabled: 'NFC sedang mati. Nyalakan lewat pengaturan ponsel.',
    printHint: 'Nomor ini harus ikut tercetak di kartu.',
    whyNoKtp: 'Verifikasi dilakukan oleh mitra penerbit.',
  },
  dropPoint: {
    title: 'Titik setor',
    nearbyTitle: 'Titik setor terdekat',
    empty: 'Belum ada titik setor terdata di sekitar sini',
    emptyHint: 'Coba perluas radius, atau cari berdasarkan wilayah.',
    distanceKm: '{value} km',
    distanceM: '{value} m',
    accepts: 'Menerima',
    minWeight: 'Minimum {value} kg',
    noMinWeight: 'Tanpa berat minimum',
    rewardCash: 'Dibayar tunai',
    rewardPoints: 'Poin platform',
    rewardNone: 'Tanpa imbalan',
    openExternal: 'Buka layanan',
    externalWarning: 'Lanjut ke layanan operator.',
    verifiedAt: 'Diperiksa {date}',
    source: 'Sumber',
    disclaimer: 'Informasi titik setor diperbarui secara berkala.',
    operatorNotice: 'Dioperasikan {operator}',
    loadError: 'Gagal memuat titik setor',
    useLocation: 'Pakai lokasi saya',
    locating: 'Mencari lokasi…',
  },
};
