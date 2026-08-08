"""
Penyatuan label lintas dataset publik.

Tiga dataset memakai nama berbeda untuk benda yang sama, dan tidak satu pun
melabeli pada tingkat grade yang menentukan harga. Berkas ini memisahkan dua hal
yang sering tercampur:

  MATERIAL — lapis yang benar-benar bisa dipelajari dari data publik.
  GRADE    — lapis yang menentukan harga di lapak; hanya diisi ketika sumbernya
             tidak ambigu, dan dibiarkan kosong ketika menebak.

Membiarkannya kosong itu disengaja. Mengisi `PET_BOTOL_BENING` untuk foto botol
PET yang warnanya tidak diketahui akan menghasilkan model yang percaya diri pada
pembedaan yang tidak pernah ia lihat.
"""
from __future__ import annotations

# --- Lapis A: material -----------------------------------------------------
MATERIALS = [
    'PLASTIK_PET',
    'PLASTIK_HDPE',
    'PLASTIK_LAIN',
    'KERTAS',
    'KARDUS',
    'LOGAM',
    'KACA',
    'RESIDU',
]

MATERIAL_LABEL_ID = {
    'PLASTIK_PET': 'Botol PET',
    'PLASTIK_HDPE': 'Plastik HDPE (botol susu, galon, sampo)',
    'PLASTIK_LAIN': 'Plastik lain',
    'KERTAS': 'Kertas',
    'KARDUS': 'Kardus',
    'LOGAM': 'Logam',
    'KACA': 'Kaca',
    'RESIDU': 'Residu / tidak bernilai',
}

# --- Pemetaan per sumber ---------------------------------------------------
# (material, grade_atau_None, catatan)
DRINKING_WASTE = {
    'AluCan': ('LOGAM', 'LOGAM_KALENG', 'kaleng minuman aluminium — tidak ambigu'),
    'Glass': ('KACA', 'KACA_BELING',
              'sumbernya botol utuh; "beling" berarti pecahan, tetapi ini satu-satunya '
              'grade kaca pada enum'),
    'PET': ('PLASTIK_PET', None, 'warna tidak dilabeli; bening dan berwarna beda harga'),
    'HDPEM': ('PLASTIK_HDPE', None, 'enum MaterialGrade belum punya grade HDPE'),
}

TRASHNET = {
    'cardboard': ('KARDUS', 'KERTAS_KARDUS', 'tidak ambigu'),
    'paper': ('KERTAS', None, 'koran, arsip, dan duplex beda harga dan tercampur di sini'),
    'glass': ('KACA', None, 'utuh atau pecah tidak dibedakan'),
    'metal': ('LOGAM', None,
              'aluminium, tembaga, besi, dan kaleng beda harga jauh dan tercampur di sini'),
    'plastic': ('PLASTIK_LAIN', None, 'jenis resin tidak dilabeli'),
    'trash': ('RESIDU', None, ''),
}

REALWASTE = {
    'Cardboard': ('KARDUS', 'KERTAS_KARDUS', 'tidak ambigu'),
    'Paper': ('KERTAS', None, ''),
    'Glass': ('KACA', None, ''),
    'Metal': ('LOGAM', None, ''),
    'Plastic': ('PLASTIK_LAIN', None, ''),
    'Food Organics': ('RESIDU', None, ''),
    'Vegetation': ('RESIDU', None, ''),
    'Textile Trash': ('RESIDU', None, ''),
    'Miscellaneous Trash': ('RESIDU', None, ''),
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


def resolve(source: str, raw_class: str):
    """Kembalikan (material, grade|None, catatan). None bila kelasnya tidak dikenal."""
    m = SOURCE_MAPS.get(source, {})
    for key, val in m.items():
        if key.lower() == raw_class.lower():
            return val
    return None


def coverage_report() -> str:
    lines = [
        f'Grade tercapai dari data publik: {len(REACHABLE_GRADES)} dari {len(ALL_GRADES)}',
        '  ' + ', '.join(REACHABLE_GRADES),
        '',
        'Grade yang menuntut foto sendiri:',
    ]
    missing = [g for g in ALL_GRADES if g not in REACHABLE_GRADES]
    for i in range(0, len(missing), 3):
        lines.append('  ' + ', '.join(missing[i:i + 3]))
    return '\n'.join(lines)


if __name__ == '__main__':
    print(coverage_report())
