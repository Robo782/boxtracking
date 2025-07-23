#!/bin/sh
set -e

# ── 1) als root: Rechte auf das gemountete Render-Verzeichnis setzen ──────────
if [ "$(id -u)" = 0 ]; then
  chown -R node:node /app/server/db 2>/dev/null || true

  # ── 2) auf den unprivilegierten User wechseln & Server starten ──────────────
  exec gosu node node server.js            # <- su-exec ➜ gosu
fi

# falls Skript schon als node aufgerufen wurde:
exec node server.js
