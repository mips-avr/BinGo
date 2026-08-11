#!/usr/bin/env python3
"""
Melatih pengklasifikasi kemasan untuk TrashScan dan melaporkan angkanya apa adanya.

Skrip ini sengaja melaporkan lebih banyak daripada akurasi. Akurasi tunggal pada
dataset yang kelasnya timpang (TrashNet: 594 kertas vs 137 trash) menyembunyikan
kelas yang gagal total, dan juri berhak menanyakannya.

Yang dihasilkan:
  - metrics.json          angka lengkap, siap dikutip
  - report.md             ringkasan yang bisa ditempel ke proposal
  - confusion_matrix.csv
  - model_int8.tflite     model terkuantisasi, siap dipasang di aplikasi
  - labels.txt

Pemakaian:
  python train.py --data data/dataset-resized --out artifacts
  python train.py --data ... --epochs-head 8 --epochs-finetune 6
  python train.py --smoke                # uji jalan dengan citra sintetis
"""
from __future__ import annotations

import argparse
import json
import os
import random
import shutil
import sys
import time
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np

SEED = 1337
IMG = 224


# ---------------------------------------------------------------------------
# 1. Muat berkas, lalu kelompokkan foto yang nyaris duplikat
# ---------------------------------------------------------------------------
def dhash(path: Path, size: int = 8) -> int:
    """Difference hash — dua foto objek yang sama dari sudut mirip akan berdekatan."""
    from PIL import Image

    im = Image.open(path).convert('L').resize((size + 1, size), Image.LANCZOS)
    px = np.asarray(im, dtype=np.int16)
    bits = (px[:, 1:] > px[:, :-1]).flatten()
    out = 0
    for b in bits:
        out = (out << 1) | int(b)
    return out


def hamming(a: int, b: int) -> int:
    return bin(a ^ b).count('1')


def cluster_near_duplicates(files: list[Path], threshold: int = 5) -> list[int]:
    """
    Kembalikan id klaster per berkas.

    Pemisahan train/val/test dilakukan per klaster, bukan per foto. Tanpa ini,
    dua foto objek fisik yang sama bisa jatuh di train dan test sekaligus, dan
    akurasinya naik semu — persis kesalahan yang paling sering ditemukan pada
    laporan klasifikasi sampah.
    """
    hashes = [dhash(f) for f in files]
    cluster = [-1] * len(files)
    nxt = 0
    for i in range(len(files)):
        if cluster[i] != -1:
            continue
        cluster[i] = nxt
        for j in range(i + 1, len(files)):
            if cluster[j] == -1 and hamming(hashes[i], hashes[j]) <= threshold:
                cluster[j] = nxt
        nxt += 1
    return cluster


def load_index(data_dir: Path) -> tuple[list[Path], list[str], list[str]]:
    classes = sorted([d.name for d in data_dir.iterdir() if d.is_dir()])
    if not classes:
        sys.exit(f'Tidak ada subfolder kelas di {data_dir}')
    files, labels = [], []
    for c in classes:
        for f in sorted((data_dir / c).iterdir()):
            if f.suffix.lower() in {'.jpg', '.jpeg', '.png'}:
                files.append(f)
                labels.append(c)
    return files, labels, classes


def split_by_cluster(files, labels, clusters, ratios=(0.70, 0.13, 0.17)):
    """
    Bagi per klaster, dengan proporsi kelas dijaga.

    Rasio 70/13/17 mengikuti Thung & Yang (2016) supaya angka kita bisa
    disandingkan langsung dengan angka mereka.
    """
    rng = random.Random(SEED)
    by_class = defaultdict(list)
    for cid in set(clusters):
        idxs = [i for i, c in enumerate(clusters) if c == cid]
        major = Counter(labels[i] for i in idxs).most_common(1)[0][0]
        by_class[major].append(idxs)

    train, val, test = [], [], []
    for cls, groups in by_class.items():
        rng.shuffle(groups)
        n = len(groups)
        n_tr = int(round(n * ratios[0]))
        n_va = int(round(n * ratios[1]))
        for g in groups[:n_tr]:
            train += g
        for g in groups[n_tr:n_tr + n_va]:
            val += g
        for g in groups[n_tr + n_va:]:
            test += g
    rng.shuffle(train); rng.shuffle(val); rng.shuffle(test)
    return train, val, test


# ---------------------------------------------------------------------------
# 2. Pipeline data
# ---------------------------------------------------------------------------
def make_ds(files, labels, idxs, classes, batch, training, tf):
    paths = [str(files[i]) for i in idxs]
    ys = [classes.index(labels[i]) for i in idxs]

    def load(p, y):
        raw = tf.io.read_file(p)
        img = tf.image.decode_image(raw, channels=3, expand_animations=False)
        img = tf.image.resize(img, (IMG, IMG))
        img = tf.cast(img, tf.float32)
        return img, y

    ds = tf.data.Dataset.from_tensor_slices((paths, ys))
    if training:
        ds = ds.shuffle(min(len(paths), 2048), seed=SEED, reshuffle_each_iteration=True)
    ds = ds.map(load, num_parallel_calls=tf.data.AUTOTUNE)
    if training:
        def aug(x, y):
            x = tf.image.random_flip_left_right(x)
            x = tf.image.random_brightness(x, 0.15)
            x = tf.image.random_contrast(x, 0.85, 1.15)
            return tf.clip_by_value(x, 0.0, 255.0), y
        ds = ds.map(aug, num_parallel_calls=tf.data.AUTOTUNE)
    return ds.batch(batch).prefetch(tf.data.AUTOTUNE)


# ---------------------------------------------------------------------------
# 3. Metrik
# ---------------------------------------------------------------------------
def per_class_prf(y_true, y_pred, n):
    out = {}
    for c in range(n):
        tp = int(np.sum((y_pred == c) & (y_true == c)))
        fp = int(np.sum((y_pred == c) & (y_true != c)))
        fn = int(np.sum((y_pred != c) & (y_true == c)))
        p = tp / (tp + fp) if tp + fp else 0.0
        r = tp / (tp + fn) if tp + fn else 0.0
        f = 2 * p * r / (p + r) if p + r else 0.0
        out[c] = {'precision': p, 'recall': r, 'f1': f, 'support': int(np.sum(y_true == c))}
    return out


def macro_f1(y_true, y_pred, n):
    d = per_class_prf(y_true, y_pred, n)
    return float(np.mean([d[c]['f1'] for c in range(n)]))


def expected_calibration_error(conf, correct, bins=10):
    """ECE — seberapa jauh 'yakin 80%' benar-benar berarti benar 80% kali."""
    edges = np.linspace(0.0, 1.0, bins + 1)
    ece, rows = 0.0, []
    for i in range(bins):
        m = (conf > edges[i]) & (conf <= edges[i + 1])
        if not m.any():
            rows.append({'bin': f'{edges[i]:.1f}-{edges[i+1]:.1f}', 'n': 0,
                         'confidence': None, 'accuracy': None})
            continue
        acc = float(correct[m].mean())
        cf = float(conf[m].mean())
        ece += (m.sum() / len(conf)) * abs(acc - cf)
        rows.append({'bin': f'{edges[i]:.1f}-{edges[i+1]:.1f}', 'n': int(m.sum()),
                     'confidence': cf, 'accuracy': acc})
    return float(ece), rows


def temperature_scale(logits, y, tf):
    """Satu parameter, dipas di validation. Menurunkan ECE tanpa mengubah akurasi."""
    best_t, best_nll = 1.0, float('inf')
    for t in np.arange(0.5, 5.01, 0.05):
        p = tf.nn.softmax(logits / t).numpy()
        nll = float(-np.mean(np.log(np.clip(p[np.arange(len(y)), y], 1e-12, 1.0))))
        if nll < best_nll:
            best_nll, best_t = nll, float(t)
    return best_t


def abstain_curve(conf, y_true, y_pred, n, thresholds=None):
    """
    Aplikasi menahan jawaban di bawah ambang. Tabel ini yang menentukan
    ambangnya, bukan tebakan.
    """
    thresholds = thresholds or [0.0, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
    rows = []
    for t in thresholds:
        keep = conf >= t
        cov = float(keep.mean())
        if keep.sum() == 0:
            rows.append({'threshold': t, 'coverage': 0.0, 'macro_f1': None, 'accuracy': None})
            continue
        rows.append({
            'threshold': float(t),
            'coverage': cov,
            'accuracy': float((y_pred[keep] == y_true[keep]).mean()),
            'macro_f1': macro_f1(y_true[keep], y_pred[keep], n),
        })
    return rows


# ---------------------------------------------------------------------------
# 4. Baseline pembanding
# ---------------------------------------------------------------------------
def baselines(files, labels, tr, te, classes):
    """
    Dua pembanding supaya angka model punya konteks:
      - kelas mayoritas: batas bawah yang tidak boleh dilewati
      - fitur warna klasik + regresi logistik: kira-kira sekuat heuristik
        yang sekarang berjalan di aplikasi
    """
    from PIL import Image
    from sklearn.linear_model import LogisticRegression

    def feat(p):
        im = Image.open(p).convert('RGB').resize((32, 32), Image.LANCZOS)
        a = np.asarray(im, dtype=np.float32) / 255.0
        hist = np.concatenate([np.histogram(a[:, :, k], bins=16, range=(0, 1))[0] for k in range(3)])
        hist = hist / max(hist.sum(), 1)
        lum = a.mean(axis=2)
        gx = np.abs(np.diff(lum, axis=1)).mean()
        gy = np.abs(np.diff(lum, axis=0)).mean()
        return np.concatenate([hist, [a[:, :, 0].mean(), a[:, :, 1].mean(), a[:, :, 2].mean(),
                                      lum.mean(), lum.std(), gx, gy]])

    ytr = np.array([classes.index(labels[i]) for i in tr])
    yte = np.array([classes.index(labels[i]) for i in te])
    major = int(Counter(ytr).most_common(1)[0][0])
    maj_pred = np.full_like(yte, major)

    Xtr = np.stack([feat(files[i]) for i in tr])
    Xte = np.stack([feat(files[i]) for i in te])
    lr = LogisticRegression(max_iter=2000, class_weight='balanced')
    lr.fit(Xtr, ytr)
    lr_pred = lr.predict(Xte)

    n = len(classes)
    return {
        'majority_class': {'accuracy': float((maj_pred == yte).mean()),
                           'macro_f1': macro_f1(yte, maj_pred, n)},
        'color_features_logreg': {'accuracy': float((lr_pred == yte).mean()),
                                  'macro_f1': macro_f1(yte, lr_pred, n)},
    }


# ---------------------------------------------------------------------------
# 5. Data sintetis untuk uji jalan
# ---------------------------------------------------------------------------
def make_smoke_data(root: Path, per_class=26):
    from PIL import Image
    rng = np.random.default_rng(SEED)
    tints = {'cardboard': (170, 130, 90), 'glass': (170, 200, 205), 'metal': (165, 168, 172),
             'paper': (225, 225, 220), 'plastic': (150, 190, 225), 'trash': (110, 100, 95)}
    for cls, tint in tints.items():
        d = root / cls
        d.mkdir(parents=True, exist_ok=True)
        for i in range(per_class):
            base = np.clip(rng.normal(tint, 26, (96, 96, 3)), 0, 255).astype(np.uint8)
            Image.fromarray(base).save(d / f'{cls}{i}.jpg', quality=88)
    return root


# ---------------------------------------------------------------------------
# 6. Alur utama
# ---------------------------------------------------------------------------
def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--data', type=Path, help='folder berisi satu subfolder per kelas')
    ap.add_argument('--out', type=Path, default=Path('artifacts'))
    ap.add_argument('--epochs-head', type=int, default=8)
    ap.add_argument('--epochs-finetune', type=int, default=6)
    ap.add_argument('--batch', type=int, default=32)
    ap.add_argument('--weights', default='imagenet',
                    help="'imagenet' (disarankan) atau 'none' bila jaringan diblokir")
    ap.add_argument('--smoke', action='store_true', help='uji jalan cepat dengan citra sintetis')
    args = ap.parse_args()

    os.environ.setdefault('TF_CPP_MIN_LOG_LEVEL', '2')
    random.seed(SEED); np.random.seed(SEED)
    import tensorflow as tf
    tf.random.set_seed(SEED)

    out = args.out
    out.mkdir(parents=True, exist_ok=True)

    if args.smoke:
        tmp = out / '_smoke_data'
        if tmp.exists():
            shutil.rmtree(tmp)
        args.data = make_smoke_data(tmp)
        args.epochs_head, args.epochs_finetune, args.weights = 1, 1, 'none'
    if not args.data:
        ap.error('--data wajib diisi (atau pakai --smoke)')

    t0 = time.time()
    files, labels, classes = load_index(args.data)
    print(f'{len(files)} citra, {len(classes)} kelas: {Counter(labels)}')

    print('Mengelompokkan foto yang nyaris duplikat…')
    clusters = cluster_near_duplicates(files)
    n_clusters = len(set(clusters))
    dupe_groups = sum(1 for _, c in Counter(clusters).items() if c > 1)
    print(f'  {n_clusters} klaster dari {len(files)} foto; {dupe_groups} klaster berisi >1 foto')

    tr, va, te = split_by_cluster(files, labels, clusters)
    print(f'Split per klaster — train {len(tr)}, val {len(va)}, test {len(te)}')

    ds_tr = make_ds(files, labels, tr, classes, args.batch, True, tf)
    ds_va = make_ds(files, labels, va, classes, args.batch, False, tf)
    ds_te = make_ds(files, labels, te, classes, args.batch, False, tf)

    w = None if args.weights == 'none' else args.weights
    backbone = tf.keras.applications.MobileNetV3Small(
        input_shape=(IMG, IMG, 3), include_top=False, weights=w,
        include_preprocessing=True, pooling='avg')
    backbone.trainable = False
    inp = tf.keras.Input((IMG, IMG, 3))
    x = backbone(inp, training=False)
    x = tf.keras.layers.Dropout(0.2)(x)
    outp = tf.keras.layers.Dense(len(classes), name='logits')(x)
    model = tf.keras.Model(inp, outp)

    ytr = np.array([classes.index(labels[i]) for i in tr])
    counts = Counter(ytr.tolist())
    cw = {c: len(ytr) / (len(classes) * counts.get(c, 1)) for c in range(len(classes))}
    print('Bobot kelas (menangani ketimpangan jumlah):',
          {classes[c]: round(v, 2) for c, v in cw.items()})

    loss = tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True)
    model.compile(tf.keras.optimizers.Adam(1e-3), loss=loss, metrics=['accuracy'])
    model.fit(ds_tr, validation_data=ds_va, epochs=args.epochs_head,
              class_weight=cw, verbose=2)

    if args.epochs_finetune > 0:
        backbone.trainable = True
        for layer in backbone.layers[:-40]:
            layer.trainable = False
        model.compile(tf.keras.optimizers.Adam(1e-5), loss=loss, metrics=['accuracy'])
        model.fit(ds_tr, validation_data=ds_va, epochs=args.epochs_finetune,
                  class_weight=cw, verbose=2)

    def logits_of(ds):
        lg = model.predict(ds, verbose=0)
        ys = np.concatenate([y.numpy() for _, y in ds])
        return lg, ys

    lg_va, y_va = logits_of(ds_va)
    lg_te, y_te = logits_of(ds_te)
    temp = temperature_scale(lg_va, y_va, tf)
    prob_te = tf.nn.softmax(lg_te / temp).numpy()
    pred_te = prob_te.argmax(1)
    conf_te = prob_te.max(1)
    n = len(classes)

    ece_raw, _ = expected_calibration_error(tf.nn.softmax(lg_te).numpy().max(1),
                                            (lg_te.argmax(1) == y_te).astype(float))
    ece_cal, rel = expected_calibration_error(conf_te, (pred_te == y_te).astype(float))

    cm = np.zeros((n, n), dtype=int)
    for t_, p_ in zip(y_te, pred_te):
        cm[t_, p_] += 1

    print('Menghitung baseline pembanding…')
    try:
        base = baselines(files, labels, tr, te, classes)
    except Exception as exc:  # sklearn opsional
        base = {'error': str(exc)}

    # ---- ekspor TFLite terkuantisasi int8 -------------------------------
    sm = out / '_saved_model'
    if sm.exists():
        shutil.rmtree(sm)
    model.export(str(sm))
    conv = tf.lite.TFLiteConverter.from_saved_model(str(sm))
    conv.optimizations = [tf.lite.Optimize.DEFAULT]

    rep_idx = tr[:200] if len(tr) >= 200 else tr

    def rep_data():
        for i in rep_idx:
            raw = tf.io.read_file(str(files[i]))
            img = tf.image.decode_image(raw, channels=3, expand_animations=False)
            img = tf.image.resize(img, (IMG, IMG))
            yield [tf.expand_dims(tf.cast(img, tf.float32), 0).numpy()]

    conv.representative_dataset = rep_data
    tfl = conv.convert()
    (out / 'model_int8.tflite').write_bytes(tfl)
    (out / 'labels.txt').write_text('\n'.join(classes) + '\n')
    size_kb = len(tfl) / 1024

    interp = tf.lite.Interpreter(model_content=tfl)
    interp.allocate_tensors()
    inp_d = interp.get_input_details()[0]
    out_d = interp.get_output_details()[0]
    sample = np.zeros(inp_d['shape'], dtype=inp_d['dtype'])
    for _ in range(3):
        interp.set_tensor(inp_d['index'], sample); interp.invoke()
    t_lat = time.time()
    for _ in range(20):
        interp.set_tensor(inp_d['index'], sample); interp.invoke()
    lat_ms = (time.time() - t_lat) / 20 * 1000
    _ = interp.get_tensor(out_d['index'])

    metrics = {
        'dataset': {
            'path': str(args.data), 'images': len(files), 'classes': classes,
            'per_class': dict(Counter(labels)),
            'near_duplicate_clusters': n_clusters,
            'clusters_with_multiple_photos': dupe_groups,
            'split': {'train': len(tr), 'val': len(va), 'test': len(te),
                      'policy': 'per klaster near-duplicate, rasio 70/13/17 (Thung & Yang 2016)'},
        },
        'model': {'backbone': 'MobileNetV3-Small', 'input': [IMG, IMG, 3],
                  'pretrained': args.weights,
                  'epochs_head': args.epochs_head, 'epochs_finetune': args.epochs_finetune},
        'test': {
            'accuracy': float((pred_te == y_te).mean()),
            'macro_f1': macro_f1(y_te, pred_te, n),
            'per_class': {classes[c]: v for c, v in per_class_prf(y_te, pred_te, n).items()},
        },
        'calibration': {'temperature': temp, 'ece_before': ece_raw, 'ece_after': ece_cal,
                        'reliability': rel},
        'abstain': abstain_curve(conf_te, y_te, pred_te, n),
        'baselines': base,
        'edge': {'tflite_int8_kb': size_kb, 'latency_ms_desktop_cpu': lat_ms,
                 'note': 'latensi diukur di CPU desktop; ukur ulang di perangkat Android target'},
        'runtime_seconds': time.time() - t0,
    }
    (out / 'metrics.json').write_text(json.dumps(metrics, indent=2, ensure_ascii=False))

    with (out / 'confusion_matrix.csv').open('w') as f:
        f.write('asli\\prediksi,' + ','.join(classes) + '\n')
        for i, c in enumerate(classes):
            f.write(c + ',' + ','.join(str(v) for v in cm[i]) + '\n')

    best = max((r for r in metrics['abstain'] if r['macro_f1'] is not None),
               key=lambda r: (r['macro_f1'], r['coverage']))
    lines = [
        '# Hasil pelatihan TrashScan', '',
        f"Dataset: {len(files)} citra, {n} kelas. Split per klaster near-duplicate "
        f"({n_clusters} klaster), rasio 70/13/17.", '',
        '## Angka utama', '',
        '| Metrik | Nilai |', '|---|---|',
        f"| Akurasi (test) | {metrics['test']['accuracy']:.3f} |",
        f"| Macro-F1 (test) | {metrics['test']['macro_f1']:.3f} |",
        f"| ECE sebelum kalibrasi | {ece_raw:.3f} |",
        f"| ECE setelah temperature scaling (T={temp:.2f}) | {ece_cal:.3f} |",
        f"| Ukuran model int8 | {size_kb:.0f} KB |",
        f"| Latensi (CPU desktop) | {lat_ms:.1f} ms |", '',
        '## Per kelas', '', '| Kelas | Presisi | Recall | F1 | n |', '|---|---|---|---|---|',
    ]
    for c in classes:
        v = metrics['test']['per_class'][c]
        lines.append(f"| {c} | {v['precision']:.3f} | {v['recall']:.3f} | {v['f1']:.3f} | {v['support']} |")
    lines += ['', '## Pembanding', '', '| Baseline | Akurasi | Macro-F1 |', '|---|---|---|']
    for k, v in base.items():
        if isinstance(v, dict) and 'accuracy' in v:
            lines.append(f"| {k} | {v['accuracy']:.3f} | {v['macro_f1']:.3f} |")
    lines += ['', '## Perilaku abstain', '',
              '| Ambang | Cakupan | Akurasi | Macro-F1 |', '|---|---|---|---|']
    for r in metrics['abstain']:
        if r['macro_f1'] is None:
            continue
        lines.append(f"| {r['threshold']:.1f} | {r['coverage']:.3f} | "
                     f"{r['accuracy']:.3f} | {r['macro_f1']:.3f} |")
    lines += ['', f"Ambang dengan macro-F1 tertinggi: **{best['threshold']:.1f}** "
                  f"(cakupan {best['coverage']:.0%}).", '',
              '## Batas yang harus dinyatakan', '',
              f"Model ini mengeluarkan {n} kelas generik ({', '.join(classes)}). Papan harga "
              'BinGo bekerja pada 18 grade, dan harga PP gelas bening berbeda dari PP gelas '
              'warna. Model ini karena itu membantu tahap identifikasi kasar, bukan penentuan '
              'grade yang menentukan harga. Kode resin tetap jalur utama.', '']
    (out / 'report.md').write_text('\n'.join(lines))

    shutil.rmtree(sm, ignore_errors=True)
    if args.smoke:
        shutil.rmtree(args.data, ignore_errors=True)

    print(f"\nSelesai dalam {metrics['runtime_seconds']:.0f} d. "
          f"akurasi={metrics['test']['accuracy']:.3f} "
          f"macro-F1={metrics['test']['macro_f1']:.3f} "
          f"int8={size_kb:.0f}KB latensi={lat_ms:.1f}ms")
    print(f'Artefak: {out}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
