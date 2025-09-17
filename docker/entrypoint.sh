#!/usr/bin/env bash
set -euo pipefail

log() { echo "[entrypoint] $*"; }

STAMP_DIR="/var/cache/auto-updates"
mkdir -p "$STAMP_DIR"

# Throttle update frequency (defaults: 24h)
YTDLP_UPDATE_INTERVAL_SECONDS="${YTDLP_UPDATE_INTERVAL_SECONDS:-86400}"
CHROME_UPDATE_INTERVAL_SECONDS="${CHROME_UPDATE_INTERVAL_SECONDS:-86400}"

now_epoch="$(date +%s || echo 0)"

should_run() {
  local stamp_file="$1"
  local interval="$2"
  if [ ! -f "$stamp_file" ]; then
    return 0
  fi
  local last_epoch
  last_epoch="$(cat "$stamp_file" 2>/dev/null || echo 0)"
  if [ $(( now_epoch - last_epoch )) -ge "$interval" ]; then
    return 0
  fi
  return 1
}

# Update yt-dlp (fast, self-update)
if command -v yt-dlp >/dev/null 2>&1; then
  ytdlp_stamp="$STAMP_DIR/yt-dlp.last"
  if should_run "$ytdlp_stamp" "$YTDLP_UPDATE_INTERVAL_SECONDS"; then
    log "Updating yt-dlp..."
    /usr/local/bin/yt-dlp -U || true
    echo "$now_epoch" > "$ytdlp_stamp" || true
  else
    log "yt-dlp update skipped (recently updated)."
  fi
else
  log "yt-dlp not found; skipping update."
fi

# Optionally update Google Chrome (slower; requires network)
UPDATE_CHROME_ON_START="${UPDATE_CHROME_ON_START:-true}"
if [ "$UPDATE_CHROME_ON_START" = "true" ]; then
  chrome_stamp="$STAMP_DIR/chrome.last"
  if should_run "$chrome_stamp" "$CHROME_UPDATE_INTERVAL_SECONDS"; then
    log "Updating google-chrome-stable..."
    apt-get update || true
    apt-get install -y --only-upgrade google-chrome-stable || true
    apt-get clean || true
    rm -rf /var/lib/apt/lists/* || true
    echo "$now_epoch" > "$chrome_stamp" || true
  else
    log "Chrome update skipped (recently updated)."
  fi
else
  log "Chrome update disabled (UPDATE_CHROME_ON_START=false)."
fi

exec "$@"


