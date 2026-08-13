#!/usr/bin/env bash
#
# Mengisi environment variables Render lewat REST API.
#
# Render CLI tidak punya perintah env var — hanya login, services, deploys,
# psql, ssh, dan blueprints validate. API-lah satu-satunya jalur otomatis.
#
# Skrip ini MEMBACA dulu variabel yang sudah ada, menggabungkannya dengan yang
# baru, lalu menulis balik. Endpoint PUT Render mengganti SELURUH daftar, jadi
# menulis langsung tanpa membaca dulu akan menghapus variabel yang tidak
# disebutkan — termasuk BLOB_READ_WRITE_TOKEN yang sudah diisi manual.
#
# Pemakaian:
#   export RENDER_API_KEY='rnd_xxx'        # Dashboard -> Account Settings -> API Keys
#   ./render-env.sh
#
set -euo pipefail

SERVICE_NAME="${SERVICE_NAME:-bingo-api}"
WEB_ORIGIN="${WEB_ORIGIN:-https://bingo-web-delta.vercel.app}"

# channel_binding sengaja dibuang. Neon menyertakannya di string bawaan, tetapi
# driver Postgres yang dipakai Prisma tidak selalu menanganinya dan gagalnya
# berupa error TLS yang tidak menyebut channel binding sama sekali. sslmode
# tetap require, jadi koneksinya tetap terenkripsi.
NEON_URL="${NEON_URL:-postgresql://neondb_owner:npg_XuAxlP3gmBj8@ep-proud-mode-azj22zg0.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require}"

if [ -z "${RENDER_API_KEY:-}" ]; then
  echo "RENDER_API_KEY belum diset."
  echo "Ambil di: Render Dashboard -> Account Settings -> API Keys -> Create API Key"
  echo "Lalu: export RENDER_API_KEY='rnd_...'"
  exit 1
fi

command -v jq >/dev/null || { echo "Butuh jq. macOS: brew install jq"; exit 1; }

API="https://api.render.com/v1"
auth=(-H "Authorization: Bearer $RENDER_API_KEY" -H "Content-Type: application/json")

echo "==> Mencari service '$SERVICE_NAME'"
SERVICE_ID=$(curl -sS "${auth[@]}" "$API/services?name=$SERVICE_NAME&limit=20" \
  | jq -r --arg n "$SERVICE_NAME" '[.[].service | select(.name==$n)][0].id // empty')

if [ -z "$SERVICE_ID" ]; then
  echo "Service '$SERVICE_NAME' tidak ditemukan. Yang ada:"
  curl -sS "${auth[@]}" "$API/services?limit=50" | jq -r '.[].service | "  \(.name)  \(.id)"'
  exit 1
fi
echo "    $SERVICE_ID"

# JWT_SECRET tidak pernah ditimpa bila sudah ada. Menggantinya akan membuat
# SELURUH token yang beredar langsung tidak sah — semua orang ter-logout.
echo "==> Membaca variabel yang sudah ada"
EXISTING=$(curl -sS "${auth[@]}" "$API/services/$SERVICE_ID/env-vars?limit=100")
echo "$EXISTING" | jq -r '.[].envVar | "    ada: \(.key)"'

HAS_JWT=$(echo "$EXISTING" | jq -r '[.[].envVar.key] | index("JWT_SECRET") // empty')
if [ -n "$HAS_JWT" ]; then
  JWT_SECRET=$(echo "$EXISTING" | jq -r '.[].envVar | select(.key=="JWT_SECRET") | .value')
  echo "    JWT_SECRET dipertahankan (mengganti = semua pengguna ter-logout)"
else
  JWT_SECRET=$(openssl rand -base64 48)
  echo "    JWT_SECRET dibuat baru"
fi

echo "==> Menggabungkan dan menulis"
PAYLOAD=$(jq -n \
  --argjson existing "$EXISTING" \
  --arg db "$NEON_URL" \
  --arg jwt "$JWT_SECRET" \
  --arg cors "$WEB_ORIGIN" '
  # Yang baru menimpa yang lama pada key yang sama; sisanya dibiarkan utuh.
  ($existing | map(.envVar | {key, value})) as $old
  | [
      {key:"NODE_ENV",       value:"production"},
      {key:"NODE_VERSION",   value:"22"},
      {key:"DATABASE_URL",   value:$db},
      {key:"DIRECT_URL",     value:$db},
      {key:"JWT_SECRET",     value:$jwt},
      {key:"JWT_EXPIRES_IN", value:"7d"},
      {key:"CORS_ORIGINS",   value:$cors}
    ] as $new
  | ($new | map(.key)) as $keys
  | ($old | map(select(.key as $k | $keys | index($k) | not))) + $new
')

curl -sS -X PUT "${auth[@]}" -d "$PAYLOAD" "$API/services/$SERVICE_ID/env-vars" \
  | jq -r '.[].envVar | "    set: \(.key)"'

echo "==> Memicu deploy ulang"
curl -sS -X POST "${auth[@]}" -d '{"clearCache":"do_not_clear"}' \
  "$API/services/$SERVICE_ID/deploys" | jq -r '"    deploy \(.id) \(.status)"'

echo
echo "Selesai. Pantau log di dashboard, lalu:"
echo "  curl -i https://$SERVICE_NAME.onrender.com/health"
echo
echo "Ingat: putar ulang password Neon setelah ini — nilainya sempat lewat chat."
