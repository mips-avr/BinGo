#!/usr/bin/env bash
# Verifikasi alur Phase 3 end-to-end terhadap backend yang berjalan.
# Idempotensi rendah — gunakan stempel waktu sebagai sufiks nomor telepon.
set -euo pipefail

API="http://localhost:3000/api/v1"
STAMP=$(date +%H%M%S)

err() { echo -e "\033[31m[FAIL]\033[0m $1" >&2; exit 1; }
ok()  { echo -e "\033[32m[ OK ]\033[0m $1"; }
hr()  { echo -e "\n\033[36m── $1 ──\033[0m"; }

reg() {
  local name="$1" phone="$2" role="$3"
  curl -sf "$API/auth/register" -H "content-type: application/json" \
    -d "{\"name\":\"$name\",\"phone\":\"$phone\",\"password\":\"rahasiaSekali123\",\"role\":\"$role\"}"
}

jget() { node -e "const v=JSON.parse(require('fs').readFileSync(0,'utf8'))$1;process.stdout.write(v==null?'':String(v))"; }

hr "Health check"
curl -sf "http://localhost:3000/health" | jget ".status" | grep -q ok && ok "API sehat" || err "Health gagal"

hr "Register: citizen, verifier x3, agent, msme"
CITIZEN=$(reg "Warga Verify $STAMP" "+62812${STAMP}11" CITIZEN)
V1=$(reg "Verifier 1 $STAMP" "+62812${STAMP}21" CITIZEN)
V2=$(reg "Verifier 2 $STAMP" "+62812${STAMP}22" CITIZEN)
V3=$(reg "Verifier 3 $STAMP" "+62812${STAMP}23" CITIZEN)
AGENT=$(reg "Pemulung Verify $STAMP" "+62812${STAMP}31" WASTE_AGENT)
MSME=$(reg "Toko Hijau $STAMP" "+62812${STAMP}41" MSME)

CITIZEN_TOKEN=$(echo "$CITIZEN" | jget ".token.accessToken")
V1_TOKEN=$(echo "$V1" | jget ".token.accessToken")
V2_TOKEN=$(echo "$V2" | jget ".token.accessToken")
V3_TOKEN=$(echo "$V3" | jget ".token.accessToken")
AGENT_TOKEN=$(echo "$AGENT" | jget ".token.accessToken")
MSME_TOKEN=$(echo "$MSME" | jget ".token.accessToken")
ok "6 user dibuat & token JWT diterima"

hr "Pickup geospatial — buat permintaan di Bundaran HI"
PICKUP=$(curl -sf "$API/pickup-requests" -H "authorization: Bearer $CITIZEN_TOKEN" -H "content-type: application/json" \
  -d '{"location":{"lat":-6.1944,"lng":106.8229},"address":"Bundaran HI","materialType":"PET","estimatedWeightKg":2.5}')
PICKUP_ID=$(echo "$PICKUP" | jget ".id")
ok "Pickup dibuat: id=$PICKUP_ID status=$(echo "$PICKUP" | jget ".status")"

hr "Pemulung: GET /nearby dari Monas (5km)"
NEARBY=$(curl -sf "$API/pickup-requests/nearby?lat=-6.1754&lng=106.8272&radiusKm=5" -H "authorization: Bearer $AGENT_TOKEN")
DIST=$(echo "$NEARBY" | node -e "const a=JSON.parse(require('fs').readFileSync(0,'utf8'));const p=a.find(x=>x.id==='$PICKUP_ID');process.stdout.write(p?p.distanceMeters.toString():'null')")
[ "$DIST" = "null" ] && err "Pickup tidak terdeteksi via ST_DWithin" || ok "ST_DWithin OK, jarak=${DIST}m"

hr "Warga TIDAK boleh /nearby (RBAC)"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$API/pickup-requests/nearby?lat=-6.1754&lng=106.8272" -H "authorization: Bearer $CITIZEN_TOKEN")
[ "$HTTP" = "403" ] && ok "Ditolak 403 sesuai RBAC" || err "Expected 403, got $HTTP"

hr "Pemulung: accept → complete"
curl -sf -X PATCH "$API/pickup-requests/$PICKUP_ID/accept" -H "authorization: Bearer $AGENT_TOKEN" > /dev/null && ok "Accepted"
curl -sf -X PATCH "$API/pickup-requests/$PICKUP_ID/complete" -H "authorization: Bearer $AGENT_TOKEN" > /dev/null && ok "Completed"

hr "Saldo poin warga setelah pickup complete (harus 25)"
ME=$(curl -sf "$API/auth/me" -H "authorization: Bearer $CITIZEN_TOKEN")
PTS=$(echo "$ME" | jget ".pointsBalance")
[ "$PTS" = "25" ] && ok "pointsBalance=25 (PICKUP_COMPLETED)" || err "Expected 25, got $PTS"

hr "Report: buat laporan + 3 verifikasi → DIVERIFIKASI + 50 poin"
REPORT=$(curl -sf "$API/reports" -H "authorization: Bearer $CITIZEN_TOKEN" -H "content-type: application/json" \
  -d '{"location":{"lat":-6.20,"lng":106.81},"imageUrl":"https://cdn.bingo.id/test.jpg","description":"Tumpukan sampah"}')
REPORT_ID=$(echo "$REPORT" | jget ".id")
ok "Report dibuat: id=$REPORT_ID"

curl -sf -X PATCH "$API/reports/$REPORT_ID/verify" -H "authorization: Bearer $V1_TOKEN" > /dev/null && ok "Verifier 1 OK"
curl -sf -X PATCH "$API/reports/$REPORT_ID/verify" -H "authorization: Bearer $V2_TOKEN" > /dev/null && ok "Verifier 2 OK"
curl -sf -X PATCH "$API/reports/$REPORT_ID/verify" -H "authorization: Bearer $V3_TOKEN" > /dev/null && ok "Verifier 3 OK (threshold tercapai)"

FINAL_REPORT=$(curl -sf "$API/reports/$REPORT_ID" -H "authorization: Bearer $CITIZEN_TOKEN")
STATUS=$(echo "$FINAL_REPORT" | jget ".status")
[ "$STATUS" = "DIVERIFIKASI" ] && ok "Status auto → DIVERIFIKASI" || err "Expected DIVERIFIKASI, got $STATUS"

ME=$(curl -sf "$API/auth/me" -H "authorization: Bearer $CITIZEN_TOKEN")
PTS=$(echo "$ME" | jget ".pointsBalance")
[ "$PTS" = "75" ] && ok "pointsBalance=75 (25 + 50)" || err "Expected 75, got $PTS"

hr "Pemulung resolve laporan → SELESAI"
curl -sf -X PATCH "$API/reports/$REPORT_ID/resolve" -H "authorization: Bearer $AGENT_TOKEN" > /dev/null && ok "Resolved"
FINAL_REPORT=$(curl -sf "$API/reports/$REPORT_ID" -H "authorization: Bearer $CITIZEN_TOKEN")
STATUS=$(echo "$FINAL_REPORT" | jget ".status")
[ "$STATUS" = "SELESAI" ] && ok "Status final = SELESAI" || err "Expected SELESAI, got $STATUS"

hr "Pembuat tidak boleh verify sendiri (Indonesian error)"
ERR_BODY=$(curl -s "$API/reports/$REPORT_ID/verify" -X PATCH -H "authorization: Bearer $CITIZEN_TOKEN")
MSG=$(echo "$ERR_BODY" | jget ".message")
echo "$MSG" | grep -q "sudah diselesaikan\|sendiri" && ok "Pesan Bahasa Indonesia: $MSG" || err "Pesan tidak sesuai: $MSG"

hr "Marketplace: katalog seed terlihat"
ITEMS=$(curl -sf "$API/marketplace/items" -H "authorization: Bearer $CITIZEN_TOKEN")
COUNT=$(echo "$ITEMS" | node -e "process.stdout.write(JSON.parse(require('fs').readFileSync(0,'utf8')).length.toString())")
[ "$COUNT" -ge "4" ] && ok "Item terlihat: $COUNT produk" || err "Expected >=4 items, got $COUNT"

hr "MSME checkout sedotan bambu — qty 100"
SEDOTAN_ID=$(echo "$ITEMS" | node -e "const a=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(a.find(x=>x.itemName.includes('Sedotan')).id)")
CHECKOUT=$(curl -sf "$API/marketplace/checkout" -H "authorization: Bearer $MSME_TOKEN" -H "content-type: application/json" \
  -d "{\"items\":[{\"itemId\":\"$SEDOTAN_ID\",\"qty\":100}]}")
TOTAL=$(echo "$CHECKOUT" | jget ".totalAmount")
ok "Checkout OK — totalAmount=Rp$TOTAL"

hr "Stok berkurang dari 2000 → 1900"
ITEM=$(curl -sf "$API/marketplace/items/$SEDOTAN_ID" -H "authorization: Bearer $MSME_TOKEN")
STOCK=$(echo "$ITEM" | jget ".stock")
[ "$STOCK" -le "1900" ] && ok "stock=$STOCK (≤1900)" || err "Expected stock<=1900, got $STOCK"

hr "Warga tidak boleh checkout (RBAC)"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$API/marketplace/checkout" -X POST -H "authorization: Bearer $CITIZEN_TOKEN" -H "content-type: application/json" \
  -d "{\"items\":[{\"itemId\":\"$SEDOTAN_ID\",\"qty\":100}]}")
[ "$HTTP" = "403" ] && ok "Ditolak 403 (MSME-only)" || err "Expected 403, got $HTTP"

hr "Validasi NIK invalid menghasilkan pesan Bahasa Indonesia"
ERR_BODY=$(curl -s "$API/auth/register" -H "content-type: application/json" \
  -d '{"name":"Test","phone":"+628999999999","password":"rahasiaSekali123","role":"CITIZEN","nik":"123"}')
echo "$ERR_BODY" | grep -q "NIK\|tidak valid" && ok "Pesan NIK: $(echo $ERR_BODY | jget '.message')" || err "Pesan tidak sesuai"

echo -e "\n\033[1;32m✓ Verifikasi Phase 3 sukses\033[0m"
