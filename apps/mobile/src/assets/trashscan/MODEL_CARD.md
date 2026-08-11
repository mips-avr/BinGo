# TrashScan MobileNetV3-Small — model card

- Dibuat: 11 Agustus 2026
- Input: `float32[1,224,224,3]`, RGB mentah 0–255
- Output: tujuh probabilitas softmax sesuai urutan pada `MODEL_LABELS`
- Asset deployment: `model_float32.tflite`
- SHA-256: `a88c93fb933ff351f78820253c064836dd15e6cf8df5f9ac082accde82d2a3e8`
- Temperature scaling: `1.3`
- Abstain threshold: `0.75`, dipilih pada validation set

## Hasil tersimpan

- 27.692 citra setelah deduplikasi dan pembatasan per sumber-kelas
- Lima sumber: Drinking Waste Classification, TrashNet, RealWaste, Garbage
  Classification 12 Classes, dan Garbage Classification V2
- Test accuracy: 92,56%
- Test macro-F1: 92,56%
- Macro-F1 pada prediksi yang melewati threshold: 97,13% dengan coverage 88,05%
- TFLite float32 vs Keras: 100% top-1 agreement pada 100 sampel

Angka test gabungan bukan bukti performa lapangan Jakarta. Uji leave-one-dataset-
out memperlihatkan domain shift, sehingga pengujian dengan foto ponsel di
pengepul/TPA tetap wajib sebelum klaim produksi.

## Batas penggunaan

Kelas `PLASTIC` hanya membuktikan benda tampak sebagai plastik. Ia tidak
membuktikan resin PET/HDPE/PVC/LDPE/PP/PS. Aplikasi karena itu menahan hasil
sebagai belum pasti sampai pengguna memberi kode resin atau koreksi manual.

Harga tidak pernah keluar dari model. Harga tetap berasal dari bukti timbang
dan papan harga mitra di wilayah pengguna.
