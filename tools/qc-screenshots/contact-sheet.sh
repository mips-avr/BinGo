#!/usr/bin/env bash
# Lembar kontak QC — satu lembar per peran.
#
# Label memakai nama berkas apa adanya, termasuk nomor urutnya, supaya sebuah
# temuan dapat langsung dirujuk ("agent-42") tanpa perlu membuka PNG-nya satu
# per satu.
set -euo pipefail
cd "$(dirname "$0")"
OUT=sheets
mkdir -p "$OUT"

for group in auth citizen agent msme; do
  files=(shots/${group}-*.png)
  [ -e "${files[0]}" ] || continue
  n=${#files[@]}
  cols=5
  [ "$n" -le 6 ] && cols=3
  # -label WAJIB mendahului berkasnya: opsi montage berlaku ke gambar yang
  # disebut SESUDAHNYA, jadi menaruhnya di belakang membuat label hilang diam-diam.
  montage -label '%t' "${files[@]}" \
    -tile "${cols}x" \
    -geometry '260x+10+10' \
    -background '#f7f7f5' \
    -fill '#0b0b0b' \
    -pointsize 13 \
    "$OUT/lembar-kontak-${group}.png"
  echo "  $OUT/lembar-kontak-${group}.png — $n layar"
done
