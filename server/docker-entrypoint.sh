#!/usr/bin/env sh
set -e

# Stelle sicher, dass das DB-Verzeichnis schreibbar ist
DISK_DIR="${RENDER_DISK:-/app/server/db}"
mkdir -p "$DISK_DIR"
chmod 770 "$DISK_DIR"

echo "[INFO] DB-Verzeichnis: $DISK_DIR"
echo "[INFO] Starte Backend …"

/usr/local/bin/node server.js
