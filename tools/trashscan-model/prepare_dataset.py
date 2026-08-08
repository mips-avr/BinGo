#!/usr/bin/env python3
"""
Mengunduh tiga dataset publik, menyatukan labelnya, dan menulis satu manifest.

Keluaran:
  <out>/images/<MATERIAL>/<source>__<nama asli>.jpg
  <out>/manifest.csv     path, source, raw_class, material, grade, dhash, cluster
  <out>/ATTRIBUTION.md   wajib disertakan — RealWaste berlisensi CC BY 4.0
  <out>/summary.json

Pemakaian:
  python prepare_dataset.py --out data/unified
  python prepare_dataset.py --out data/unified --sources trashnet realwaste
  python prepare_dataset.py --out data/unified --dry-run
"""
from __future__ import annotations

import argparse
import csv
import io
import json
import os
import shutil
import subprocess
import sys
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

from label_map import (MATERIAL_LABEL_ID, MATERIALS, REACHABLE_GRADES, SOURCE_META,
                       coverage_report, resolve)

IMG_EXT = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}


# ---------------------------------------------------------------------------
# Pengunduhan
# ---------------------------------------------------------------------------
def need(mod: str, pip_name: str | None = None):
    try:
        __import__(mod)
    except ImportError:
        sys.exit(f'Modul "{mod}" belum terpasang. Jalankan: pip install {pip_name or mod}')


def fetch_drinking_waste(raw: Path) -> Path:
    """Kaggle. Butuh ~/.kaggle/kaggle.json (Settings -> API -> Create New Token)."""
    dest = raw / 'drinking_waste'
    if dest.exists():
        return dest
    need('kaggle', 'kaggle')
    ref = SOURCE_META['drinking_waste']['kaggle_ref']
    dest.mkdir(parents=True, exist_ok=True)
    print(f'  mengunduh {ref} dari Kaggle…')
    subprocess.run(['kaggle', 'datasets', 'download', '-d', ref, '-p', str(dest), '--unzip'],
                   check=True)
    return dest


def fetch_trashnet(raw: Path) -> Path:
    """HuggingFace. Repo aslinya menaruh citra di Drive; mirror HF lebih stabil."""
    dest = raw / 'trashnet'
    if dest.exists():
        return dest
    need('huggingface_hub', 'huggingface_hub')
    from huggingface_hub import snapshot_download
    print('  mengunduh garythung/trashnet dari HuggingFace…')
    snapshot_download(SOURCE_META['trashnet']['hf_repo'], repo_type='dataset',
                      local_dir=str(dest))
    return dest


def fetch_realwaste(raw: Path) -> Path:
    """UCI ML Repository, arsip zip langsung."""
    dest = raw / 'realwaste'
    if dest.exists():
        return dest
    need('requests', 'requests')
    import requests
    url = 'https://archive.ics.uci.edu/static/public/908/realwaste.zip'
    print(f'  mengunduh {url}…')
    r = requests.get(url, timeout=300)
    r.raise_for_status()
    dest.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(r.content)) as z:
        z.extractall(dest)
    return dest


FETCHERS = {
    'drinking_waste': fetch_drinking_waste,
    'trashnet': fetch_trashnet,
    'realwaste': fetch_realwaste,
}


# ---------------------------------------------------------------------------
# Penemuan berkas
# ---------------------------------------------------------------------------
def discover(root: Path, source: str) -> list[tuple[Path, str]]:
    """
    Cari (berkas, nama_kelas). Ketiga dataset menaruh kelas sebagai nama folder,
    tetapi kedalamannya berbeda-beda, jadi dicocokkan ke belakang dari nama berkas.
    """
    from label_map import SOURCE_MAPS
    known = {k.lower() for k in SOURCE_MAPS[source]}
    out = []
    for f in root.rglob('*'):
        if not f.is_file() or f.suffix.lower() not in IMG_EXT:
            continue
        cls = None
        for part in reversed(f.parts[:-1]):
            if part.lower() in known:
                cls = part
                break
        if cls:
            out.append((f, cls))
    return out


# ---------------------------------------------------------------------------
# Duplikat
# ---------------------------------------------------------------------------
def dhash_int(path: Path, size: int = 8) -> int | None:
    from PIL import Image
    try:
        im = Image.open(path).convert('L').resize((size + 1, size), Image.LANCZOS)
    except Exception:
        return None
    import numpy as np
    px = np.asarray(im, dtype=np.int16)
    bits = (px[:, 1:] > px[:, :-1]).flatten()
    v = 0
    for b in bits:
        v = (v << 1) | int(b)
    return v


def cluster(hashes: list[int], threshold: int = 5) -> list[int]:
    """
    Kelompokkan foto yang nyaris sama. Dipakai dua kali: membuang duplikat
    lintas-sumber, dan nanti memisahkan train/val/test per klaster.

    Bucketing 16-bit teratas memangkas perbandingan dari O(n^2) penuh menjadi
    sekadar cepat pada puluhan ribu citra.
    """
    n = len(hashes)
    cid = [-1] * n
    buckets: dict[int, list[int]] = defaultdict(list)
    for i, h in enumerate(hashes):
        buckets[h >> 48].append(i)
    nxt = 0
    for i in range(n):
        if cid[i] != -1:
            continue
        cid[i] = nxt
        for key in (hashes[i] >> 48,):
            for j in buckets[key]:
                if j > i and cid[j] == -1 and bin(hashes[i] ^ hashes[j]).count('1') <= threshold:
                    cid[j] = nxt
        nxt += 1
    return cid


# ---------------------------------------------------------------------------
# Utama
# ---------------------------------------------------------------------------
def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', type=Path, default=Path('data/unified'))
    ap.add_argument('--raw', type=Path, default=Path('data/raw'))
    ap.add_argument('--sources', nargs='+', default=list(FETCHERS),
                    choices=list(FETCHERS))
    ap.add_argument('--dry-run', action='store_true',
                    help='hanya cetak rencana dan peta label, tanpa mengunduh')
    args = ap.parse_args()

    print(coverage_report())
    print()

    if args.dry_run:
        print('Rencana:')
        for s in args.sources:
            m = SOURCE_META[s]
            print(f"  {m['name']:32s} ~{m['images']:>6,} citra  {m['license']}")
            print(f"    {m['url']}")
        return 0

    need('PIL', 'pillow')
    args.raw.mkdir(parents=True, exist_ok=True)
    img_root = args.out / 'images'
    if img_root.exists():
        shutil.rmtree(img_root)
    for m in MATERIALS:
        (img_root / m).mkdir(parents=True, exist_ok=True)

    rows, unknown = [], Counter()
    for s in args.sources:
        print(f'[{s}]')
        root = FETCHERS[s](args.raw)
        found = discover(root, s)
        print(f'  {len(found)} citra ditemukan')
        for f, raw_cls in found:
            res = resolve(s, raw_cls)
            if not res:
                unknown[f'{s}/{raw_cls}'] += 1
                continue
            material, grade, note = res
            rows.append({'src_path': f, 'source': s, 'raw_class': raw_cls,
                         'material': material, 'grade': grade or '', 'note': note})

    if unknown:
        print('\nKelas yang tidak dikenal (dilewati):')
        for k, v in unknown.most_common():
            print(f'  {k}: {v}')

    print(f'\n{len(rows)} citra terpetakan. Menghitung hash duplikat…')
    hashes = []
    keep = []
    for r in rows:
        h = dhash_int(r['src_path'])
        if h is None:
            continue
        r['dhash'] = h
        hashes.append(h)
        keep.append(r)
    rows = keep

    cids = cluster(hashes)
    for r, c in zip(rows, cids):
        r['cluster'] = c

    seen, deduped = set(), []
    for r in rows:
        if r['cluster'] in seen:
            continue
        seen.add(r['cluster'])
        deduped.append(r)
    dropped = len(rows) - len(deduped)
    print(f'{dropped} citra dibuang sebagai duplikat (termasuk lintas-sumber); '
          f'{len(deduped)} tersisa')

    print('Menyalin ke folder tersatukan…')
    manifest = []
    for r in deduped:
        name = f"{r['source']}__{r['raw_class']}__{r['src_path'].stem}{r['src_path'].suffix.lower()}"
        dst = img_root / r['material'] / name
        shutil.copy2(r['src_path'], dst)
        manifest.append({'path': str(dst.relative_to(args.out)), 'source': r['source'],
                         'raw_class': r['raw_class'], 'material': r['material'],
                         'grade': r['grade'], 'cluster': r['cluster'],
                         'dhash': r['dhash'], 'note': r['note']})

    with (args.out / 'manifest.csv').open('w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(manifest[0].keys()))
        w.writeheader()
        w.writerows(manifest)

    per_material = Counter(m['material'] for m in manifest)
    per_source = Counter(m['source'] for m in manifest)
    per_grade = Counter(m['grade'] for m in manifest if m['grade'])
    summary = {
        'total_images': len(manifest),
        'duplicates_dropped': dropped,
        'per_material': {k: per_material[k] for k in MATERIALS},
        'per_source': dict(per_source),
        'per_grade_reachable': dict(per_grade),
        'grades_reachable': REACHABLE_GRADES,
        'grades_total': 18,
        'sources': {s: SOURCE_META[s] for s in args.sources},
    }
    (args.out / 'summary.json').write_text(json.dumps(summary, indent=2, ensure_ascii=False))

    att = ['# Atribusi dan lisensi dataset', '',
           'Berkas ini wajib ikut disertakan. RealWaste berlisensi CC BY 4.0 yang',
           'mensyaratkan penyebutan sumber.', '']
    for s in args.sources:
        m = SOURCE_META[s]
        att += [f"## {m['name']}", '', f"- Lisensi: {m['license']}", f"- Sumber: {m['url']}",
                f"- Atribusi: {m['attribution']}",
                f"- Citra terpakai setelah dedup: {per_source.get(s, 0)}", '']
    (args.out / 'ATTRIBUTION.md').write_text('\n'.join(att))

    print('\nSebaran per material:')
    for m in MATERIALS:
        bar = '#' * int(40 * per_material[m] / max(per_material.values() or [1]))
        print(f'  {MATERIAL_LABEL_ID[m]:42s} {per_material[m]:>6,}  {bar}')
    print(f'\nSelesai. {args.out}/manifest.csv, summary.json, ATTRIBUTION.md')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
