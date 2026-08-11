# Dataset publik untuk TrashScan

Semua angka dan lisensi di bawah diverifikasi dari sumber resminya masing-masing
pada Agustus 2026, bukan dari ingatan. Kalau ada yang berubah, sumbernya
dicantumkan supaya bisa dicek ulang.

## Temuan utama sebelum memilih

**Tidak ada dataset publik yang berlabel 18 grade BinGo.** Yang paling dekat
adalah WaDaBa (kode resin + warna + tingkat kekotoran), dan itu pun butuh
perjanjian lisensi untuk anotasinya.

Konsekuensinya taksonomi dibuat **tiga lapis**, dan pemisahannya menentukan
apakah modelnya bisa dipasang sama sekali:

| Lapis | Satuan | Jumlah | Dari mana |
|---|---|---|---|
| **Kelas latih** | apa yang bisa dibedakan model dari foto | **10** | dataset publik |
| **MaterialType** | satuan yang dipahami aplikasi | **8 dari 12** | turunan kelas latih |
| **MaterialGrade** | satuan yang menentukan harga | **2 dari 18** | hanya yang tidak ambigu |

**Kelas latih sengaja tidak sama dengan MaterialType.** Kardus dan kertas
keduanya `PAPER` di mata aplikasi, tetapi jelas berbeda di mata kamera dan
berbeda harga di lapak — jadi dilatih terpisah lalu digabung saat keluar. Sama
untuk kaleng aluminium versus logam lain: selisih harganya besar dan dataset
memang melabelinya. Melebur keduanya sejak awal berarti membuang sinyal yang
sudah tersedia gratis.

**Empat `MaterialType` tidak tercapai sama sekali: PVC, LDPE, PS, PP.** Tidak
ada dataset publik yang melabelinya, dan justru inilah jenis yang paling sering
ditemui pemulung — kresek, gelas plastik, sedotan, styrofoam.

**Hanya 2 dari 18 grade** yang bisa diturunkan tanpa menebak: `KERTAS_KARDUS`
dan `LOGAM_KALENG`. Turun dari tiga pada versi pertama, dan itu perbaikan bukan
kemunduran: `KACA_BELING` sebelumnya diklaim dari kelas "Glass" Drinking Waste,
padahal "beling" berarti **pecahan** sedangkan sumbernya botol utuh. Klaim itu
akan runtuh pada pertanyaan pertama juri, dan lebih buruk lagi, akan
menyesatkan harga di lapak.

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

`label_map.py` menyatukan nama kelas ketiga dataset ke satu daftar kelas latih,
lalu menerjemahkannya ke enum aplikasi. Berkas itu satu-satunya tempat
terjemahan ini hidup; kalau enum di `packages/shared-types` berubah, di situlah
perubahannya.

| Sumber | Kelas asal | Kelas latih | MaterialType | Grade |
|---|---|---|---|---|
| Drinking Waste | AluCan | `METAL_CAN` | `METAL` | `LOGAM_KALENG` |
| Drinking Waste | Glass | `GLASS` | `GLASS` | — ¹ |
| Drinking Waste | PET | `PET` | `PET` | — ² |
| Drinking Waste | HDPEM | `HDPE` | `HDPE` | — ³ |
| TrashNet | cardboard | `CARDBOARD` | `PAPER` | `KERTAS_KARDUS` |
| TrashNet | paper | `PAPER` | `PAPER` | — ⁴ |
| TrashNet | glass | `GLASS` | `GLASS` | — |
| TrashNet | metal | `METAL_OTHER` | `METAL` | — ⁵ |
| TrashNet | plastic | `PLASTIC_OTHER` | `OTHER_PLASTIC` | — |
| TrashNet | trash | `MIXED` | `MIXED` | — |
| RealWaste | Cardboard | `CARDBOARD` | `PAPER` | `KERTAS_KARDUS` |
| RealWaste | Paper | `PAPER` | `PAPER` | — |
| RealWaste | Glass | `GLASS` | `GLASS` | — |
| RealWaste | Metal | `METAL_OTHER` | `METAL` | — |
| RealWaste | Plastic | `PLASTIC_OTHER` | `OTHER_PLASTIC` | — |
| RealWaste | Food Organics, Vegetation | `ORGANIC` | `ORGANIC` | — |
| RealWaste | Textile Trash, Miscellaneous Trash | `MIXED` | `MIXED` | — |

¹ Satu-satunya grade kaca pada enum adalah `KACA_BELING` yang berarti pecahan,
sedangkan sumbernya botol utuh. Grade sengaja tidak diklaim. Kalau lapak mitra
membedakan botol utuh dan beling, enum perlu ditambah.

² PET bening dan PET berwarna beda harga, dan tidak ada dataset publik yang
melabeli warnanya. Inilah contoh paling jelas kenapa foto sendiri tetap perlu.

³ Enum belum punya grade HDPE. Lihat catatan di atas.

⁴ Koran, arsip/HVS, dan duplex punya harga berbeda dan semuanya masuk "paper".

⁵ Kaleng dipisahkan menjadi `METAL_CAN` karena Drinking Waste melabelinya
tersendiri. Sisanya — tembaga, besi, aluminium lembaran — tercampur di
`METAL_OTHER`, dan tembaga bisa puluhan kali lipat harga besi.

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
