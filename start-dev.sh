#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# British Academy — dev starter
# Backend (Express :5000) + Frontend (Next.js :3000) birlikdə işə salır.
# İstifadə:  bash start-dev.sh     (Ctrl+C hər ikisini dayandırır)
# ---------------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "$0")"

API_DIR="apps/api"
WEB_DIR="apps/web"

info() { printf "\033[1;36m[dev]\033[0m %s\n" "$1"; }
warn() { printf "\033[1;33m[dev]\033[0m %s\n" "$1"; }

# --- Asılılıqlar (yoxdursa quraşdır) ---------------------------------------
for d in "$API_DIR" "$WEB_DIR"; do
  if [ ! -d "$d/node_modules" ]; then
    info "$d — asılılıqlar quraşdırılır (npm install)…"
    (cd "$d" && npm install)
  fi
done

# --- MongoDB xəbərdarlığı (bloklamır) --------------------------------------
if command -v mongosh >/dev/null 2>&1; then
  mongosh --quiet --eval 'db.runCommand({ ping: 1 })' mongodb://localhost:27017 >/dev/null 2>&1 \
    && info "MongoDB (localhost:27017) qoşuludur." \
    || warn "MongoDB (localhost:27017) cavab vermir — API bağlana bilməz. 'mongod' işə sal."
else
  warn "mongosh tapılmadı — MongoDB-nin localhost:27017-də işlədiyinə əmin ol."
fi

# --- Hər iki serveri işə sal, Ctrl+C-də təmizlə ----------------------------
pids=()
cleanup() {
  info "Dayandırılır…"
  for pid in "${pids[@]}"; do kill "$pid" 2>/dev/null || true; done
  wait 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM

info "Backend başlayır → http://localhost:5000"
(cd "$API_DIR" && npm run dev) &
pids+=($!)

info "Frontend başlayır → http://localhost:3000"
(cd "$WEB_DIR" && npm run dev) &
pids+=($!)

info "Hazırdır. Dayandırmaq üçün Ctrl+C."
wait
