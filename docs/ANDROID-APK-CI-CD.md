# CI/CD APK Android

BinGo memakai Expo Continuous Native Generation. Folder `android/` tidak
disimpan di Git; GitHub Actions menjalankan `expo prebuild` lalu Gradle pada
setiap build agar modul NFC dan TFLite selalu ikut ter-autolink.

## CI — APK untuk QA

Workflow `Android APK CI` berjalan pada pull request, push ke `main`, dan
manual dispatch. Ia menjalankan typecheck, seluruh test mobile, membangun APK
standalone release dengan sertifikat debug CI, memverifikasi signature, lalu
menyimpan APK selama 14 hari pada tab **Actions → Artifacts**.

APK CI dapat dipasang langsung untuk pengujian internal, tetapi sertifikat debug
tidak boleh dipakai untuk distribusi resmi atau Google Play.

## CD — APK release bertanda tangan

Workflow `Android APK Release` berjalan pada tag `v*` atau manual dispatch.
Build manual disimpan sebagai artifact. Build dari tag juga diterbitkan otomatis
sebagai asset pada halaman **GitHub Releases**.

Tambahkan empat repository secrets melalui **Settings → Secrets and variables →
Actions**:

- `BINGO_ANDROID_KEYSTORE_BASE64`
- `BINGO_ANDROID_KEYSTORE_PASSWORD`
- `BINGO_ANDROID_KEY_ALIAS`
- `BINGO_ANDROID_KEY_PASSWORD`

Keystore baru dapat dibuat satu kali dengan JDK:

```bash
keytool -genkeypair -v \
  -keystore bingo-release.jks \
  -alias bingo \
  -keyalg RSA -keysize 4096 -validity 10000
```

Encode berkasnya menjadi satu baris sebelum dimasukkan sebagai secret:

```bash
# Linux
base64 -w 0 bingo-release.jks

# macOS
base64 -i bingo-release.jks
```

Simpan backup keystore dan password di tempat terpisah yang aman. Kehilangan
signing key berarti APK yang sudah terpasang tidak dapat diperbarui dengan build
baru yang memakai key berbeda.

## Menerbitkan versi

Setelah perubahan berada pada commit yang akan dirilis:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Tag menentukan `versionName`; `versionCode` memakai nomor run GitHub Actions
agar selalu naik. APK release hanya memuat ABI `arm64-v8a` dan `armeabi-v7a`
untuk ponsel Android fisik, bukan emulator x86.
