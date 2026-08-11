# Model klasifikasi TrashScan

Pipeline untuk melatih pengklasifikasi kemasan on-device dari **dataset publik
berlisensi jelas**, lalu melaporkan angkanya dengan cara yang tahan ditanyai
juri.

## Kemampuan model — apa yang benar-benar bisa ia keluarkan

Model final 11 Agustus 2026 memiliki tujuh kelas visual lintas-dataset:
`PLASTIC`, `PAPER`, `CARDBOARD`, `METAL`, `GLASS`, `ORGANIC`, dan `MIXED`.

| Kelas model | → MaterialType | → Grade | Perlakuan aplikasi |
|---|---|---|---|
| `PLASTIC` | `OTHER_PLASTIC` | — | wajib kode resin/koreksi pengguna |
| `PAPER` | `PAPER` | — | dapat dipakai bila melewati threshold |
| `CARDBOARD` | `PAPER` | `KERTAS_KARDUS` | dapat dipakai bila melewati threshold |
| `METAL` | `METAL` | — | dapat dipakai bila melewati threshold |
| `GLASS` | `GLASS` | — | dapat dipakai bila melewati threshold |
| `ORGANIC` | `ORGANIC` | — | dapat dipakai bila melewati threshold |
| `MIXED` | `MIXED` | — | dapat dipakai bila melewati threshold |

Model **tidak menebak PET, HDPE, PVC, LDPE, PP, atau PS dari rupa plastik**.
Dataset umum tidak konsisten memberi label resin. Kode resin 1–7 tetap jalur
utama; keluaran visual `PLASTIC` sengaja berakhir sebagai keadaan belum pasti.

Karena itu model ini **asisten identifikasi kasar, bukan penentu harga**. Kode
resin tetap jalur utama karena ia fakta, bukan tebakan; model adalah tahap dua
ketika kode tidak terlihat.

Kalau nanti mau mengangkat kebaruan lewat model, yang bernilai bukan
arsitekturnya melainkan **datasetnya**: foto material per-grade sebagaimana
dipakai lapak Indonesia belum ada di publik mana pun. 30–50 foto per grade sudah
cukup untuk mulai, dan pengumpulannya bisa digabung dengan wawancara pemulung
yang memang diminta juri.

Rincian pemilihan dataset, lisensi, dan pemetaan label: **[`DATASETS.md`](DATASETS.md)**.

## Kredensial Kaggle

Satu dari tiga sumber (Drinking Waste Classification) hanya ada di Kaggle.

```bash
pip install kaggle
# kaggle.com → ikon profil → Settings → API → Create New Token
mkdir -p ~/.kaggle && mv ~/Downloads/kaggle.json ~/.kaggle/
chmod 600 ~/.kaggle/kaggle.json
kaggle datasets list -s "drinking waste"      # uji token
```

Di Colab:

```python
from google.colab import files; files.upload()      # pilih kaggle.json
!mkdir -p ~/.kaggle && cp kaggle.json ~/.kaggle/ && chmod 600 ~/.kaggle/kaggle.json
```

`prepare_dataset.py` memeriksa kredensial lebih dulu dan menjelaskan apa yang
kurang, alih-alih gagal dengan stack trace. Tanpa Kaggle, dua sumber lain tetap
bisa dipakai — tetapi kelas `HDPE` dan `METAL_CAN` kehilangan hampir seluruh
contohnya dan `PET` kehilangan sumber terbesarnya, dan itu wajib disebut bila
angkanya dikutip.

## Cara menjalankan

### Kaggle — jalur yang disarankan

`train_trashscan_kaggle.ipynb`. **Tidak butuh `kaggle.json` sama sekali** —
dataset dilampirkan lewat panel Input, bukan diunduh.

1. kaggle.com/code → **New Notebook** → **File → Import Notebook** → unggah
   `train_trashscan_kaggle.ipynb`
2. Panel kanan → **+ Add Input** → lampirkan: `drinking waste classification`,
   `trashnet`, `realwaste`
3. Panel kanan → **Accelerator: GPU T4 x2**, **Internet: On**
4. **Run All**. Sekitar 40–70 menit dengan ketiga dataset.
5. Tab **Output** → unduh `artifacts/`

Notebook mengenali sendiri dataset mana yang terpasang dengan membaca nama
folder kelasnya, jadi mirror mana pun boleh. Kalau ada yang belum dilampirkan,
ia tetap jalan dan menyebutkan konsekuensinya di layar dan di `report.md` —
bukan diam-diam menghasilkan angka yang lebih rendah.

Internet harus **On** hanya untuk mengunduh bobot ImageNet MobileNetV3 (~4 MB)
sekali. Datasetnya sendiri tidak pernah diunduh.

### Colab — alternatif

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

Artefak final tersimpan sebagai model Keras float32, tiga varian TFLite,
`labels.txt`, `app_labels.json`, serta laporan training/conversion/validation.
Varian yang dipasang adalah **`model_float32.tflite`**: agreement terhadap
Keras 100% pada sampel validasi konversi dan ukuran 3,65 MB. Int8 tidak dipakai
karena agreement hanya 79%.

Berkas terakhir itu yang membuat model dapat dipasang sama sekali: ia memetakan
tiap kelas latih ke `MaterialType` dan `MaterialGrade`. Tanpa itu, keluaran
model tidak berarti apa-apa bagi aplikasi — `CARDBOARD` dan `METAL_CAN` bukan
nilai `MaterialType` yang sah, sehingga tidak bisa masuk `ScanResult`,
`gradesForMaterial()`, penyaring titik setor, maupun papan harga.

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

## Pemasangan ke aplikasi

Sudah dipasang melalui `react-native-fast-tflite` 3.0.1 dengan CPU delegate.
Metro membundel `apps/mobile/src/assets/trashscan/model_float32.tflite`, lalu
`visualClassifier.ts` melakukan resize 224×224, menyusun tensor RGB float32
0–255, menjalankan inference, temperature scaling `T=1,3`, dan threshold `0,75`.

Model berjalan on-device dan foto tidak dikirim ke backend. Karena modul
inference bersifat native, TrashScan model memerlukan development build/APK dan
tidak berjalan di Expo Go.

## Yang tidak boleh diklaim

- Bukan "akurasi 97%" dari makalah orang lain. Kutip angkamu sendiri.
- Bukan "AI menentukan harga". Harga datang dari bukti timbang, bukan dari model.
- Bukan angka latensi notebook sebagai angka perangkat.
- Bukan grade apa pun di luar dua yang benar-benar tercapai.
- Bukan PVC, LDPE, PS, atau PP. Model tidak pernah melihat satu pun contohnya.
- Bukan angka dari mode `SMOKE`. Itu citra acak.
