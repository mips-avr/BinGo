# Model klasifikasi TrashScan

Pipeline untuk melatih pengklasifikasi kemasan on-device dari **dataset publik
berlisensi jelas**, lalu melaporkan angkanya dengan cara yang tahan ditanyai
juri.

## Baca ini dulu

Taksonomi di sini dua lapis, dan pemisahan itu yang paling penting dipahami:

- **Lapis material — 8 kelas.** Bisa dicapai dari dataset publik. Inilah yang
  dilatih.
- **Lapis grade — 18 kelas.** Menentukan harga di papan harga BinGo. Dari 18,
  hanya **3** yang bisa diturunkan dari data publik tanpa menebak
  (`LOGAM_KALENG`, `KERTAS_KARDUS`, `KACA_BELING`).

Selisih harga terbesar justru ada pada pembedaan yang tidak dilabeli dataset
mana pun: PET bening versus berwarna, koran versus arsip versus duplex, tembaga
versus besi. Artinya model ini **asisten identifikasi kasar, bukan penentu
harga**. Kode resin tetap jalur utama karena ia fakta, bukan tebakan; model
adalah tahap dua ketika kode tidak terlihat.

Rincian lengkap pemilihan dataset, lisensi, dan pemetaan label: **[`DATASETS.md`](DATASETS.md)**.

## Cara menjalankan

### Colab — jalur yang disarankan

Buka `train_trashscan.ipynb` di Google Colab, pilih runtime GPU, lalu Run all.
Notebook mengambil `label_map.py` dan `prepare_dataset.py` sendiri dari
repositori, jadi tidak perlu menyalin apa pun.

Sel pertama punya saklar `SMOKE`. `SMOKE = True` menjalankan seluruh notebook di
atas citra sintetis dalam beberapa menit tanpa mengunduh apa pun — dipakai untuk
memastikan notebooknya jalan sebelum menunggu unduhan 17 ribu citra. Angka yang
keluar dalam mode ini acak dan tidak boleh dikutip.

### Lokal

```bash
pip install -r requirements.txt
python prepare_dataset.py --out data/unified                     # ketiga sumber
python prepare_dataset.py --out data/unified --dry-run           # lihat rencana saja
python prepare_dataset.py --out data/unified --sources trashnet realwaste
```

`prepare_dataset.py` mengunduh, menyatukan label, membuang duplikat lintas-sumber
dengan difference hash, lalu menulis `manifest.csv`, `summary.json`, dan
`ATTRIBUTION.md`. **Jangan hapus berkas atribusi** — RealWaste berlisensi CC BY
4.0 yang mensyaratkan penyebutan sumber.

Satu dari tiga sumber (Drinking Waste) perlu akun Kaggle gratis. Token diambil
dari kaggle.com → Settings → API → Create New Token, disimpan sebagai
`~/.kaggle/kaggle.json`.

`train.py` adalah versi CLI yang lebih tua dan bekerja pada satu folder dataset
saja; notebook adalah jalur utama sekarang.

## Keluaran

`artifacts/`: `metrics.json`, `report.md`, `model_int8.tflite`, `labels.txt`.

## Yang dilaporkan, dan mengapa

**Tiga dataset, bukan satu.** TrashNet difoto dengan objek di atas posterboard
putih. Model yang hanya belajar dari situ belajar "objek di atas latar bersih"
lalu ambruk begitu bertemu foto ponsel di gerobak atau di lantai lapak.
RealWaste difoto di titik penerimaan TPA sungguhan — ia penawar racun itu.

**Uji lintas-dataset.** Latih di satu sumber, uji di sumber lain. Selisihnya
adalah perkiraan paling jujur tentang seberapa jauh model bertahan di lapangan,
dan justru karena tidak memihak, ia angka yang paling meyakinkan dibawa ke
sidang. Angka dalam-sumber yang tinggi tanpa angka lintas-sumber adalah klaim
yang belum diuji.

**Split per klaster near-duplicate, bukan per foto.** Difference hash tiap citra,
klaster berjarak Hamming ≤ 5 digabung, lalu klasternya yang dibagi. Tanpa ini
dua foto objek fisik yang sama bisa jatuh di train dan test sekaligus dan
akurasinya naik semu. Rasio 70/13/17 mengikuti Thung & Yang supaya angkamu bisa
disandingkan langsung dengan 75% yang mereka laporkan.

**Macro-F1, bukan akurasi saja.** Datanya timpang. Akurasi tunggal menyembunyikan
kelas yang gagal total; tabel per kelas menunjukkan mana yang benar-benar bekerja.

**Kalibrasi.** ECE mengukur apakah "yakin 80%" benar-benar berarti benar 80%
kali. Temperature scaling dipas di validation, bukan di test. Ini yang membuat
ambang abstain di aplikasi punya arti.

**Kurva abstain.** Cakupan versus macro-F1 pada berbagai ambang. Dari sinilah
ambang di aplikasi ditetapkan — bukan dari tebakan.

**Ukuran dan latensi.** Model dikuantisasi int8. Latensi diukur di CPU notebook —
**ukur ulang di perangkat Android target** sebelum angkanya dikutip.

## Temuan yang perlu ditindaklanjuti di produk

Enum `MaterialGrade` di `packages/shared-types` **tidak punya grade HDPE**,
padahal botol HDPE (galon, botol susu, botol sampo) rutin diperdagangkan lapak
dan punya kelas sendiri di dataset publik. Sekarang ia terpaksa jatuh ke
`PLASTIK_CAMPUR` yang harganya jauh lebih rendah. Pertimbangkan menambah
`HDPE_RIGID`.

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
- Bukan angka latensi notebook sebagai angka perangkat.
- Bukan grade apa pun di luar tiga yang benar-benar tercapai.
- Bukan angka dari mode `SMOKE`. Itu citra acak.
