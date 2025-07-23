#!/bin/sh
set -e

# -- nur root darf chown --
if [ "$(id -u)" = "0" ]; then
  chown -R node:node /app/server/db 2>/dev/null || true
  # wechsle auf den node-User und starte eigentliche App
  exec su-exec node node server.js        # alpine images
  # oder: exec gosu node node server.js    # debian-slim images
fi

# falls schon als node aufgerufen → einfach starten
exec node server.js
