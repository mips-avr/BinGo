# Dataset publik untuk TrashScan

Semua angka dan lisensi di bawah diverifikasi dari sumber resminya masing-masing
pada Agustus 2026, bukan dari ingatan. Kalau ada yang berubah, sumbernya
dicantumkan supaya bisa dicek ulang.

## Temuan utama sebelum memilih

**Tidak ada dataset publik yang berlabel 18 grade BinGo.** Yang paling dekat
adalah WaDaBa (kode resin + warna + tingkat kekotoran), dan itu pun butuh
perjanjian lisensi untuk anotasinya. Konsekuensinya taksonomi dibuat dua lapis:

- **Lapis A — material (8 kelas).** Bisa dicapai dari dataset publik. Inilah yang
  dilatih sekarang.
- **Lapis B — grade (18 kelas).** Menentukan harga, dan hanya bisa dicapai dari
  foto sendiri di lapak mitra. Belum ada datanya.

Dari 18 grade, **hanya 3 yang bisa diturunkan langsung dari dataset publik tanpa
menebak**: `LOGAM_KALENG` (dari kelas Aluminium Cans), `KERTAS_KARDUS` (dari
Cardboard), dan `KACA_BELING` (dari Glass, dengan catatan di bawah). Sisanya
menuntut pembedaan yang tidak dilabeli dataset mana pun — terutama bening versus
berwarna, yang justru menentukan selisih harga terbesar.

**Satu temuan yang perlu ditindaklanjuti di produk, bukan di model:** enum
`MaterialGrade` tidak punya grade HDPE, padahal botol HDPE (galon, botol susu,
botol sampo) adalah material yang rutin diperdagangkan lapak dan punya kelas
sendiri di dataset publik. Sekarang ia terpaksa jatuh ke `PLASTIK_CAMPUR` yang
harganya jauh lebih rendah. Pertimbangkan menambah `HDPE_RIGID`.

## Yang dipakai

Tiga dataset, dipilih karena lisensinya jelas dan ketiganya saling menutupi
kelemahan masing-masing.

| Dataset | Citra | Kelas | Lisensi | Alasan dipilih |
|---|---|---|---|---|
| [Drinking Waste Classification](https://www.kaggle.com/datasets/arkadiyhacks/drinking-waste-classification) | ~9.640 | 4 — Aluminium Cans, Glass bottles, PET bottles, HDPE Milk bottles | **CC0** | Satu-satunya dataset yang kelasnya benar-benar material yang diperdagangkan, bukan kategori akademik. Terbesar juga. |
| [TrashNet](https://github.com/garythung/trashnet) | 2.527 | 6 — glass, paper, cardboard, plastic, metal, trash | **MIT** | Pembanding wajib: Thung & Yang melaporkan 75% pada split 70/13/17, jadi angkamu punya lawan tanding yang setara. |
| [RealWaste](https://archive.ics.uci.edu/dataset/908/realwaste) | 4.752 | 9 — Cardboard, Food Organics, Glass, Metal, Miscellaneous Trash, Paper, Plastic, Textile Trash, Vegetation | **CC BY 4.0** | Difoto di titik penerimaan TPA sungguhan. Ini penawar racun TrashNet. |

### Kenapa ketiganya, bukan TrashNet saja

TrashNet difoto dengan objek diletakkan di atas **posterboard putih** dengan
cahaya matahari atau lampu ruangan. Model yang hanya dilatih di situ belajar
"objek di atas latar putih bersih", lalu ambruk begitu bertemu foto ponsel
pemulung di gerobak, di lantai lapak, atau di bawah cahaya sore. RealWaste
difoto di lokasi sungguhan, jadi ia memaksa model belajar bentuk dan tekstur,
bukan latar.

Notebook karena itu menjalankan **uji lintas-dataset**: latih di satu sumber,
uji di sumber lain. Selisihnya adalah angka yang paling jujur tentang seberapa
jauh model ini akan bertahan di lapangan — dan angka yang paling meyakinkan
untuk ditunjukkan ke juri, justru karena ia tidak memihak.

## Yang dipertimbangkan tapi tidak dipakai

| Dataset | Citra | Kenapa tidak |
|---|---|---|
| [WaDaBa](http://wadaba.pcz.pl/) | 4.000 | Paling dekat dengan kebutuhan sebenarnya: label kode resin, warna, tingkat deformasi, dan kekotoran. Tapi anotasinya butuh perjanjian lisensi. **Layak diminta** — kalau dapat, ini melompati kebutuhan foto sendiri untuk sebagian grade. |
| [TACO](http://tacodataset.org/) | 1.500 | MIT, 60 subkategori, tapi berformat COCO dengan kotak pembatas. Perlu dipotong per objek dulu. Berguna nanti untuk deteksi, bukan klasifikasi. |
| [Garbage Dataset V2](https://www.kaggle.com/datasets/sumn2u/garbage-classification-v2) | 19.762 | 10 kelas, jumlahnya menggoda, tetapi lisensinya tidak dinyatakan. Jangan dipakai di karya yang menyertakan pernyataan orisinalitas bermaterai. |
| [TrashBox](https://github.com/nikhilvenkatkumsetty/TrashBox) | 17.785 | Sama — lisensi tidak dinyatakan. |
| [Waste Classification Data](https://www.kaggle.com/datasets/techsash/waste-classification-data) | ~25.000 | Hanya 2 kelas (organik/anorganik). Terlalu kasar; tidak menambah apa pun di atas yang sudah ada. |
| ZeroWaste | 4.503 | CC BY-**NC** 4.0. Non-commercial. Aman untuk lomba, tetapi mengunci jalur pemanfaatan lanjutan. Dihindari sejak awal supaya tidak jadi masalah nanti. |

Sumber daftar: [waste-datasets-review](https://github.com/AgaMiko/waste-datasets-review).

## Pemetaan label

Tiga dataset memakai nama kelas yang berbeda-beda untuk benda yang sama. Berkas
`label_map.py` menyatukannya ke Lapis A, dan menandai grade Lapis B hanya ketika
sumbernya tidak ambigu.

| Sumber | Kelas asal | Lapis A (material) | Lapis B (grade) |
|---|---|---|---|
| Drinking Waste | AluCan | LOGAM | `LOGAM_KALENG` |
| Drinking Waste | Glass | KACA | `KACA_BELING` ¹ |
| Drinking Waste | PET | PLASTIK_PET | — ² |
| Drinking Waste | HDPEM | PLASTIK_HDPE | — ³ |
| TrashNet | cardboard | KARDUS | `KERTAS_KARDUS` |
| TrashNet | paper | KERTAS | — ⁴ |
| TrashNet | glass | KACA | — |
| TrashNet | metal | LOGAM | — ⁵ |
| TrashNet | plastic | PLASTIK_LAIN | — |
| TrashNet | trash | RESIDU | — |
| RealWaste | Cardboard | KARDUS | `KERTAS_KARDUS` |
| RealWaste | Paper | KERTAS | — |
| RealWaste | Glass | KACA | — |
| RealWaste | Metal | LOGAM | — |
| RealWaste | Plastic | PLASTIK_LAIN | — |
| RealWaste | Food Organics, Vegetation, Textile Trash, Miscellaneous Trash | RESIDU | — |

¹ "Beling" sebenarnya berarti pecahan kaca, sedangkan sumbernya botol utuh. Ini
satu-satunya grade kaca yang ada di enum, jadi dipakai dengan catatan. Kalau
lapak mitra membedakan botol utuh dan beling, enum perlu ditambah.

² PET bening dan PET berwarna beda harga, dan tidak ada dataset publik yang
melabeli warnanya. Inilah contoh paling jelas kenapa foto sendiri tetap perlu.

³ Enum belum punya grade HDPE. Lihat catatan di atas.

⁴ Koran, arsip/HVS, dan duplex punya harga berbeda dan semuanya masuk "paper".

⁵ Aluminium, tembaga, besi, dan kaleng punya harga yang sangat berbeda —
tembaga bisa puluhan kali lipat besi — dan semuanya masuk "metal".

## Cara mengunduh

Perlu akun Kaggle (gratis) untuk satu dari tiga sumber. Token API diambil dari
kaggle.com → Settings → API → Create New Token, lalu simpan sebagai
`~/.kaggle/kaggle.json`.

```bash
pip install -r requirements.txt
python prepare_dataset.py --out data/unified          # ketiganya
python prepare_dataset.py --out data/unified --sources trashnet realwaste
```

Skrip akan mengunduh, menyatukan label, membuang duplikat lintas-sumber, lalu
menulis `manifest.csv` beserta berkas atribusi lisensi. Jangan hapus berkas
atribusi itu — CC BY 4.0 pada RealWaste mensyaratkan penyebutan sumber.

## Yang harus disebut di naskah

Kalau model ini jadi dipakai, Bab 5.4.1 dan Dokumen Teknis 4.2 perlu menyebut:
sumber dataset beserta lisensinya, jumlah citra per kelas, kebijakan pemisahan
train/val/test, hasil uji lintas-dataset, dan — ini yang paling penting — bahwa
keluaran model berhenti di lapis material, sedangkan harga ditentukan di lapis
grade yang belum tercakup.
