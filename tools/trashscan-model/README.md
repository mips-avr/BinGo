# Model klasifikasi TrashScan

Pipeline untuk melatih pengklasifikasi kemasan on-device dan melaporkan angkanya
dengan cara yang tahan ditanyai juri.

## Baca ini dulu

Model dari dataset publik mengeluarkan **6 kelas generik** — cardboard, glass,
metal, paper, plastic, trash. Papan harga BinGo bekerja pada **18 grade**, dan
harga PP gelas bening berbeda dari PP gelas warna. Artinya model ini membantu
tahap identifikasi kasar, **bukan** penentuan grade yang menentukan harga.

Konsekuensinya untuk cara bicara: kode resin tetap jalur utama karena ia fakta,
bukan tebakan. Model adalah tahap dua ketika kode tidak terlihat. Jangan
menyebut modelnya sebagai penentu harga — ia bukan, dan juri akan menemukan itu
dalam satu pertanyaan.

Kalau nanti mau mengangkat kebaruan lewat model, yang bernilai bukan
arsitekturnya melainkan **datasetnya**: foto material per-grade sebagaimana
dipakai lapak Indonesia belum ada di publik mana pun. 30–50 foto per grade sudah
cukup untuk mulai, dan pengumpulannya bisa digabung dengan wawancara pemulung
yang memang diminta juri.

## Menyiapkan dataset

```bash
pip install -r requirements.txt

# TrashNet — 2.527 citra, 6 kelas (Thung & Yang, CS229 Stanford 2016)
pip install huggingface_hub
python -c "
from huggingface_hub import snapshot_download
snapshot_download('garythung/trashnet', repo_type='dataset', local_dir='data/trashnet')
"
```

Susun jadi satu folder per kelas:

```
data/trashnet/
  cardboard/  glass/  metal/  paper/  plastic/  trash/
```

TACO (`github.com/pedropro/TACO`, 1.500 citra beranotasi) berformat COCO dengan
kotak pembatas, jadi perlu dipotong per objek dulu bila mau digabung. Mulai dari
TrashNet saja lebih dulu; menggabungkan dua dataset dengan definisi kelas berbeda
menambah sumber galat yang sulit dijelaskan.

## Menjalankan

```bash
python train.py --data data/trashnet --out artifacts
python train.py --smoke            # uji jalan 40 detik dengan citra sintetis
```

Keluaran di `artifacts/`: `metrics.json`, `report.md`, `confusion_matrix.csv`,
`model_int8.tflite`, `labels.txt`.

Butuh internet untuk mengunduh bobot ImageNet. Tanpa bobot itu (`--weights none`)
akurasinya jatuh drastis — persis alasan CNN Thung & Yang hanya mencapai 27% pada
poster aslinya.

## Yang dilaporkan, dan mengapa

**Split per klaster near-duplicate, bukan per foto.** Skrip menghitung difference
hash tiap citra, mengelompokkan yang berjarak Hamming ≤ 5, lalu membagi per
klaster. Tanpa ini, dua foto objek fisik yang sama bisa jatuh di train dan test
sekaligus dan akurasinya naik semu. Rasio 70/13/17 sengaja mengikuti Thung & Yang
supaya angkamu bisa disandingkan langsung dengan angka mereka.

**Macro-F1, bukan akurasi saja.** TrashNet timpang — 594 kertas versus 137 trash.
Akurasi tunggal menyembunyikan kelas yang gagal total. Tabel per kelas
menunjukkan mana yang benar-benar bekerja.

**Kalibrasi.** ECE mengukur apakah "yakin 80%" benar-benar berarti benar 80%
kali. Temperature scaling dipas di validation, bukan di test. Ini yang membuat
ambang abstain di aplikasi punya arti.

**Kurva abstain.** Tabel cakupan versus macro-F1 pada berbagai ambang. Dari
sinilah ambang di aplikasi ditetapkan — bukan dari tebakan.

**Dua baseline.** Kelas mayoritas sebagai batas bawah, dan fitur warna klasik +
regresi logistik yang kira-kira sekuat heuristik yang sekarang berjalan. Kalau
model tidak mengalahkan keduanya dengan selisih yang jelas, ia belum layak
dipasang.

**Ukuran dan latensi.** Model dikuantisasi int8. Latensi diukur di CPU desktop —
**ukur ulang di perangkat Android target** sebelum angkanya dikutip.

## Memasang ke aplikasi

Belum dikerjakan; ini jalurnya bila nanti diputuskan jalan.

`react-native-fast-tflite` punya config plugin Expo dan mendukung delegate
GPU/NNAPI serta CoreML, tetapi **butuh development build — tidak jalan di Expo
Go**. APK untuk juri tidak terpengaruh.

Sisi aplikasi sudah punya tempatnya: `apps/mobile/src/features/scanner/pipeline.ts`
sudah memisahkan tahap 1 (kode resin) dan tahap 2 (dugaan visual), dan
`visualClassifier.ts` memegang ambang abstain. Model masuk menggantikan isi tahap
2, dengan ambang diambil dari kurva abstain di `metrics.json`.

Yang berubah di naskah bila model jadi dipasang: Bab 5.4.1, Dokumen Teknis 4.2,
dan baris AI/ML pada tabel stack — ketiganya sekarang menyatakan tidak ada model
terlatih.

## Yang tidak boleh diklaim

- Bukan "akurasi 97%" dari makalah orang lain. Kutip angkamu sendiri.
- Bukan "AI menentukan harga". Harga datang dari bukti timbang, bukan dari model.
- Bukan angka latensi desktop sebagai angka perangkat.
