#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# British Academy — dev başladıcı
# Həm API (apps/api) həm Web (apps/web) dev serverlərini birlikdə qaldırır.
#
# İstifadə:
#   ./dev.sh            # ikisini də başlat
#   ./dev.sh api        # yalnız API
#   ./dev.sh web        # yalnız Web
#
# Ctrl+C hər iki prosesi dayandırır.
# ─────────────────────────────────────────────────────────────
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:-all}"

# Paket meneceri: pnpm üstünlükdə, yoxdursa npm.
if command -v pnpm >/dev/null 2>&1; then
  PM=pnpm
else
  PM=npm
fi

pids=()

cleanup() {
  echo ""
  echo "⏹  Dayandırılır…"
  for pid in "${pids[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM

start_api() {
  echo "🟦 API başladılır → apps/api ($PM run dev)"
  ( cd "$ROOT/apps/api" && $PM run dev ) &
  pids+=($!)
}

start_web() {
  # Windows-da Turbopack "Application Control policy" səbəbindən bloklanır,
  # ona görə webpack ilə işə salırıq.
  echo "🟩 Web başladılır → apps/web ($PM exec next dev --webpack)"
  ( cd "$ROOT/apps/web" && $PM exec next dev --webpack ) &
  pids+=($!)
}

case "$TARGET" in
  api) start_api ;;
  web) start_web ;;
  all) start_api; start_web ;;
  *) echo "Naməlum arqument: '$TARGET' (api | web | all)"; exit 1 ;;
esac

echo "✅ Hazırdır. Dayandırmaq üçün Ctrl+C."
wait
