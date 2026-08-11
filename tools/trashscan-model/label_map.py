"""
Penyatuan label lintas dataset publik — dan penyambungannya ke enum aplikasi.

Perubahan terpenting dibanding versi pertama: **label model sekarang adalah nilai
`MaterialType` yang benar-benar dipakai aplikasi.** Versi sebelumnya melatih
kelas bernama `PLASTIK_PET`, `KARDUS`, `RESIDU` — nama yang bagus dibaca manusia,
tetapi tidak satu pun merupakan nilai `MaterialType` yang sah. Akibatnya model
yang sudah terlatih tetap tidak bisa dipasang: keluarannya tidak muat ke
`ScanResult.materialType`, tidak bisa masuk `gradesForMaterial()`, tidak bisa
menyaring titik setor, dan tidak bisa memanggil papan harga. Seluruh rantai
sesudah pemindaian menolak nilainya.

Tiga lapis, dan pemisahannya disengaja:

  KELAS LATIH — apa yang benar-benar bisa dibedakan model dari foto.
  MATERIAL     — `MaterialType`, satuan yang dipahami aplikasi.
  GRADE        — `MaterialGrade`, satuan yang menentukan harga.

Kelas latih tidak sama dengan material, dan itu bukan kelalaian. Kardus dan
kertas keduanya `PAPER` di mata aplikasi, tetapi berbeda jelas di mata kamera
dan berbeda harga di lapak — jadi keduanya dilatih terpisah lalu digabung saat
keluar. Hal yang sama untuk kaleng aluminium versus logam lain: selisih harganya
besar, dan dataset memang melabelinya.

Arah sebaliknya tidak boleh: menebak grade yang tidak dilabeli sumbernya.
Membiarkan grade kosong itu disengaja. Mengisi `PET_BOTOL_BENING` untuk foto
botol PET yang warnanya tidak diketahui menghasilkan model yang percaya diri
pada pembedaan yang tidak pernah ia lihat.
"""
from __future__ import annotations

# ---------------------------------------------------------------------------
# Lapis 1 — kelas yang dilatih
# ---------------------------------------------------------------------------
# Urutannya mengikat: indeks kelas pada model, isi labels.txt, dan urutan kolom
# confusion matrix semuanya bersandar pada urutan ini. Menyisipkan kelas di
# tengah membuat model lama salah membaca dirinya sendiri.
TRAIN_CLASSES = [
    'PET',
    'HDPE',
    'PLASTIC_OTHER',
    'PAPER',
    'CARDBOARD',
    'METAL_CAN',
    'METAL_OTHER',
    'GLASS',
    'ORGANIC',
    'MIXED',
]

# Nama lama dipertahankan supaya notebook dan skrip yang sudah ada tidak putus.
MATERIALS = TRAIN_CLASSES

MATERIAL_LABEL_ID = {
    'PET': 'Botol PET',
    'HDPE': 'Plastik HDPE (galon, botol susu, botol sampo)',
    'PLASTIC_OTHER': 'Plastik lain',
    'PAPER': 'Kertas',
    'CARDBOARD': 'Kardus',
    'METAL_CAN': 'Kaleng aluminium',
    'METAL_OTHER': 'Logam lain',
    'GLASS': 'Kaca',
    'ORGANIC': 'Organik',
    'MIXED': 'Campuran / residu',
}

# ---------------------------------------------------------------------------
# Lapis 2 & 3 — jembatan ke enum aplikasi
# ---------------------------------------------------------------------------
# (MaterialType, MaterialGrade|None, alasan)
#
# Inilah satu-satunya tempat keluaran model diterjemahkan ke bahasa aplikasi.
# Kalau enum di packages/shared-types berubah, berkas ini yang harus ikut.
TRAIN_CLASS_TO_APP: dict[str, tuple[str, str | None, str]] = {
    'PET': ('PET', None, 'bening dan berwarna beda harga; tidak ada sumber yang melabeli warnanya'),
    'HDPE': ('HDPE', None, 'enum MaterialGrade belum punya grade HDPE — lihat catatan di bawah'),
    'PLASTIC_OTHER': ('OTHER_PLASTIC', None, 'jenis resin tidak dilabeli sumber mana pun'),
    'PAPER': ('PAPER', None, 'koran, arsip, dan duplex beda harga dan tercampur di kelas ini'),
    'CARDBOARD': ('PAPER', 'KERTAS_KARDUS', 'kardus tidak ambigu dan punya grade sendiri'),
    'METAL_CAN': ('METAL', 'LOGAM_KALENG', 'kaleng minuman aluminium — tidak ambigu'),
    'METAL_OTHER': ('METAL', None, 'tembaga, besi, dan aluminium lembaran beda harga jauh'),
    'GLASS': ('GLASS', None,
              'satu-satunya grade kaca pada enum adalah KACA_BELING yang berarti PECAHAN, '
              'sedangkan sumbernya botol utuh — grade sengaja tidak diklaim'),
    'ORGANIC': ('ORGANIC', None, ''),
    'MIXED': ('MIXED', None, ''),
}

# Nilai MaterialType yang TIDAK dapat dicapai dari dataset publik mana pun.
# Ketiganya justru jenis yang paling sering ditemui pemulung di lapangan.
UNREACHABLE_MATERIAL_TYPES = ['PVC', 'LDPE', 'PS', 'PP']


def to_app_label(train_class: str) -> tuple[str, str | None]:
    """Terjemahkan satu kelas model menjadi (MaterialType, MaterialGrade|None)."""
    material, grade, _ = TRAIN_CLASS_TO_APP[train_class]
    return material, grade


# ---------------------------------------------------------------------------
# Pemetaan per sumber
# ---------------------------------------------------------------------------
# (kelas_latih, grade_atau_None, catatan)
DRINKING_WASTE = {
    'AluCan': ('METAL_CAN', 'LOGAM_KALENG', 'kaleng minuman aluminium — tidak ambigu'),
    'Glass': ('GLASS', None, 'botol utuh; grade kaca tidak diklaim'),
    'PET': ('PET', None, 'warna tidak dilabeli; bening dan berwarna beda harga'),
    'HDPEM': ('HDPE', None, 'enum MaterialGrade belum punya grade HDPE'),
}

TRASHNET = {
    'cardboard': ('CARDBOARD', 'KERTAS_KARDUS', 'tidak ambigu'),
    'paper': ('PAPER', None, 'koran, arsip, dan duplex beda harga dan tercampur di sini'),
    'glass': ('GLASS', None, 'utuh atau pecah tidak dibedakan'),
    'metal': ('METAL_OTHER', None,
              'kaleng, aluminium, tembaga, dan besi tercampur; kaleng murni hanya ada di '
              'Drinking Waste'),
    'plastic': ('PLASTIC_OTHER', None, 'jenis resin tidak dilabeli'),
    'trash': ('MIXED', None, ''),
}

REALWASTE = {
    'Cardboard': ('CARDBOARD', 'KERTAS_KARDUS', 'tidak ambigu'),
    'Paper': ('PAPER', None, ''),
    'Glass': ('GLASS', None, ''),
    'Metal': ('METAL_OTHER', None, ''),
    'Plastic': ('PLASTIC_OTHER', None, ''),
    'Food Organics': ('ORGANIC', None, ''),
    'Vegetation': ('ORGANIC', None, ''),
    'Textile Trash': ('MIXED', None, ''),
    'Miscellaneous Trash': ('MIXED', None, ''),
}

SOURCE_MAPS = {
    'drinking_waste': DRINKING_WASTE,
    'trashnet': TRASHNET,
    'realwaste': REALWASTE,
}

SOURCE_META = {
    'drinking_waste': {
        'name': 'Drinking Waste Classification',
        'images': 9640,
        'license': 'CC0 1.0 Universal (Public Domain)',
        'url': 'https://www.kaggle.com/datasets/arkadiyhacks/drinking-waste-classification',
        'attribution': 'Arkadiy Serezhkin, Drinking Waste Classification, Kaggle (CC0).',
        'kaggle_ref': 'arkadiyhacks/drinking-waste-classification',
    },
    'trashnet': {
        'name': 'TrashNet',
        'images': 2527,
        'license': 'MIT',
        'url': 'https://github.com/garythung/trashnet',
        'attribution': ('Gary Thung and Mindy Yang, TrashNet, Stanford CS229 (2016), MIT '
                        'License.'),
        'hf_repo': 'garythung/trashnet',
    },
    'realwaste': {
        'name': 'RealWaste',
        'images': 4752,
        'license': 'CC BY 4.0',
        'url': 'https://archive.ics.uci.edu/dataset/908/realwaste',
        'attribution': ('Single, S., Iranmanesh, S., & Raad, R. (2023). RealWaste [Dataset]. '
                        'UCI Machine Learning Repository. CC BY 4.0.'),
        'uci_id': 908,
    },
}

# Grade yang benar-benar tercapai dari data publik, tanpa menebak.
#
# Turun dari tiga menjadi dua dibanding versi pertama, dan itu perbaikan bukan
# kemunduran: KACA_BELING sebelumnya diklaim dari kelas "Glass" Drinking Waste,
# padahal "beling" berarti pecahan sedangkan sumbernya botol utuh. Klaim itu
# akan runtuh pada pertanyaan pertama juri, dan lebih buruk lagi, akan
# menyesatkan harga di lapak.
REACHABLE_GRADES = sorted({
    g for m in SOURCE_MAPS.values() for (_, g, _) in m.values() if g
})

# 18 grade pada packages/shared-types/src/weighing.ts
ALL_GRADES = [
    'PET_BOTOL_BENING', 'PET_BOTOL_WARNA', 'PP_GELAS_BENING', 'PP_GELAS_WARNA',
    'PP_PLASTIK_PUTIH', 'LDPE_KRESEK', 'PLASTIK_CAMPUR', 'KERTAS_KORAN',
    'KERTAS_ARSIP', 'KERTAS_KARDUS', 'KERTAS_DUPLEX', 'LOGAM_ALUMINIUM',
    'LOGAM_TEMBAGA', 'LOGAM_BESI', 'LOGAM_KALENG', 'KACA_BELING',
    'MINYAK_JELANTAH', 'MULTILAYER_SACHET',
]

# 12 nilai MaterialType pada packages/shared-types/src/pickup.ts
ALL_MATERIAL_TYPES = [
    'PET', 'HDPE', 'PVC', 'LDPE', 'PP', 'PS', 'OTHER_PLASTIC',
    'PAPER', 'METAL', 'GLASS', 'ORGANIC', 'MIXED',
]


def resolve(source: str, raw_class: str):
    """Kembalikan (kelas_latih, grade|None, catatan). None bila tidak dikenal."""
    m = SOURCE_MAPS.get(source, {})
    for key, val in m.items():
        if key.lower() == raw_class.lower():
            return val
    return None


def coverage_report() -> str:
    reachable_types = sorted({TRAIN_CLASS_TO_APP[c][0] for c in TRAIN_CLASSES})
    missing_types = [t for t in ALL_MATERIAL_TYPES if t not in reachable_types]
    missing_grades = [g for g in ALL_GRADES if g not in REACHABLE_GRADES]

    lines = [
        f'Kelas yang dilatih: {len(TRAIN_CLASSES)}',
        '  ' + ', '.join(TRAIN_CLASSES),
        '',
        f'MaterialType tercapai: {len(reachable_types)} dari {len(ALL_MATERIAL_TYPES)}',
        '  ' + ', '.join(reachable_types),
        f'MaterialType TIDAK tercapai: {", ".join(missing_types)}',
        '  (semuanya menuntut foto sendiri — tidak ada dataset publik yang melabelinya,',
        '   dan justru inilah jenis yang paling sering ditemui pemulung di lapangan)',
        '',
        f'MaterialGrade tercapai: {len(REACHABLE_GRADES)} dari {len(ALL_GRADES)}',
        '  ' + ', '.join(REACHABLE_GRADES),
        '',
        'Grade yang menuntut foto sendiri:',
    ]
    for i in range(0, len(missing_grades), 3):
        lines.append('  ' + ', '.join(missing_grades[i:i + 3]))
    lines += [
        '',
        'Catatan produk: enum MaterialGrade tidak punya grade HDPE, padahal galon,',
        'botol susu, dan botol sampo rutin diperdagangkan lapak dan punya kelas',
        'sendiri di dataset publik. Sekarang semuanya jatuh ke PLASTIK_CAMPUR yang',
        'harganya jauh lebih rendah. Pertimbangkan menambah HDPE_RIGID.',
    ]
    return '\n'.join(lines)


def app_mapping_table() -> str:
    """Tabel kelas latih → (MaterialType, grade). Dicetak notebook ke laporan."""
    rows = ['| Kelas latih | MaterialType | Grade | Catatan |', '|---|---|---|---|']
    for c in TRAIN_CLASSES:
        material, grade, note = TRAIN_CLASS_TO_APP[c]
        rows.append(f'| `{c}` | `{material}` | {f"`{grade}`" if grade else "—"} | {note or "—"} |')
    return '\n'.join(rows)


if __name__ == '__main__':
    print(coverage_report())
    print()
    print(app_mapping_table())
