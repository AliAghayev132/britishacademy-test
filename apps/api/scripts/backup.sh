#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  British Academy — gündəlik ehtiyat nüsxə (audit #45)
#
#  Nə saxlanılır:
#    db-<vaxt>.archive.gz      mongodump (bütün kolleksiyalar, gzip)
#    uploads-<vaxt>.tar.gz     yüklənmiş şəkil, video və sənədlər
#
#  Hər ikisi lazımdır: bazada yalnız /uploads/... yolları var, fayllar
#  diskdədir. Birinin olub o birinin olmaması saytı bərpa etmir.
#
#  Parametrlər (mühit dəyişəni kimi, hamısı ixtiyari):
#    APP_DIR                 server reposu (defolt: bu skriptin bir üst qovluğu)
#    BACKUP_DIR              nüsxələrin qovluğu (defolt: /var/backups/britishacademy)
#    KEEP_DAYS               lokal nüsxələr neçə gün qalsın (defolt: 14)
#    MONGODB_URI             verilməsə APP_DIR/.env-dən oxunur
#    BACKUP_RCLONE_REMOTE    məs. "gdrive:britishacademy" — verilsə nüsxə oraya
#                            da köçürülür (serverin diski yanarsa lokal nüsxə
#                            də gedir; əsl qoruma BAŞQA yerdəki nüsxədir)
#    REMOTE_KEEP_DAYS        uzaq nüsxələr neçə gün qalsın (defolt: 60)
#    BACKUP_PING_URL         uğurda GET, uğursuzluqda <url>/fail
#                            (healthchecks.io kimi) — cron səssizcə dayansa
#                            xəbər tutmaq üçün
#
#  Cron (hər gecə 03:30):
#    30 3 * * * /var/www/britishacademy/server/scripts/backup.sh >> /var/log/ba-backup.log 2>&1
#
#  Bərpa: scripts/README.md → «Ehtiyat nüsxə».
# ─────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${APP_DIR:-$(dirname "$SCRIPT_DIR")}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/britishacademy}"
KEEP_DAYS="${KEEP_DAYS:-14}"
REMOTE_KEEP_DAYS="${REMOTE_KEEP_DAYS:-60}"
STAMP="$(date +%Y%m%d-%H%M%S)"

log() { echo "[$(date '+%F %T')] $*"; }

ping_status() {
  [ -n "${BACKUP_PING_URL:-}" ] || return 0
  curl -fsS -m 10 --retry 3 "${BACKUP_PING_URL}$1" >/dev/null 2>&1 || true
}

fail() {
  trap - ERR
  log "XƏTA: $*"
  rm -f "${DB_FILE:-}.part" "${UP_FILE:-}.part"
  ping_status /fail
  exit 1
}
trap 'fail "sətir $LINENO-də gözlənilməz dayanma"' ERR

# ── MONGODB_URI ──
# .env `source` edilmir: parolda $, ! və ya boşluq ola bilər, shell onları
# şərh edib səhv ünvan qurardı. Yalnız bir sətir oxunur, dırnaqlar atılır.
if [ -z "${MONGODB_URI:-}" ] && [ -f "$APP_DIR/.env" ]; then
  MONGODB_URI="$(grep -E '^[[:space:]]*MONGODB_URI=' "$APP_DIR/.env" | tail -n 1 | cut -d= -f2- | tr -d '\r')"
  MONGODB_URI="${MONGODB_URI%\"}"; MONGODB_URI="${MONGODB_URI#\"}"
  MONGODB_URI="${MONGODB_URI%\'}"; MONGODB_URI="${MONGODB_URI#\'}"
fi
[ -n "${MONGODB_URI:-}" ] || fail "MONGODB_URI tapılmadı ($APP_DIR/.env)"
command -v mongodump >/dev/null || fail "mongodump yoxdur — mongodb-database-tools qurun"
[ -d "$APP_DIR/uploads" ] || fail "$APP_DIR/uploads qovluğu yoxdur"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
umask 077

# Eyni anda iki nüsxə işləməsin (əl ilə + cron).
if command -v flock >/dev/null; then
  exec 9>"$BACKUP_DIR/.lock"
  flock -n 9 || fail "başqa nüsxə hələ işləyir"
fi

DB_FILE="$BACKUP_DIR/db-$STAMP.archive.gz"
UP_FILE="$BACKUP_DIR/uploads-$STAMP.tar.gz"

# Yarımçıq fayl «uğurlu nüsxə» kimi qalmasın: əvvəl .part-a yazılır.
log "baza: mongodump başladı"
mongodump --uri="$MONGODB_URI" --gzip --archive="$DB_FILE.part" --quiet
[ -s "$DB_FILE.part" ] || fail "mongodump boş fayl yaratdı"
mv "$DB_FILE.part" "$DB_FILE"
log "baza: $(du -h "$DB_FILE" | cut -f1)"

log "fayllar: uploads arxivlənir"
tar -czf "$UP_FILE.part" -C "$APP_DIR" uploads
gzip -t "$UP_FILE.part" || fail "uploads arxivi zədəlidir"
mv "$UP_FILE.part" "$UP_FILE"
log "fayllar: $(du -h "$UP_FILE" | cut -f1)"

# ── Başqa yerə köçürmə ──
if [ -n "${BACKUP_RCLONE_REMOTE:-}" ]; then
  command -v rclone >/dev/null || fail "BACKUP_RCLONE_REMOTE verilib, amma rclone yoxdur"
  log "uzaq: $BACKUP_RCLONE_REMOTE-ə köçürülür"
  rclone copy "$DB_FILE" "$BACKUP_RCLONE_REMOTE"
  rclone copy "$UP_FILE" "$BACKUP_RCLONE_REMOTE"
  rclone delete "$BACKUP_RCLONE_REMOTE" --min-age "${REMOTE_KEEP_DAYS}d" \
    --include "db-*.archive.gz" --include "uploads-*.tar.gz"
fi

# ── Köhnələri silmək ──
# Yalnız UĞURLU nüsxə alınandan sonra: skript sınarsa köhnələr toxunulmaz qalır.
find "$BACKUP_DIR" -maxdepth 1 -type f \
  \( -name 'db-*.archive.gz' -o -name 'uploads-*.tar.gz' -o -name '*.part' \) \
  -mtime +"$KEEP_DAYS" -delete

log "hazır: $(basename "$DB_FILE"), $(basename "$UP_FILE")"
ping_status ""
