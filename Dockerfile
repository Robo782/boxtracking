###############################################################################
# 1) Frontend-Build (client-build Stage)                                      #
###############################################################################
FROM node:18-slim AS client-build

# ── Build-Tools (für notfalls native Add-ons) ────────────────────────────────
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
       build-essential python3 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app/client

# nur Client-Abhängigkeiten
COPY client/package*.json ./
RUN npm ci                       # Vite + dev-Deps

# Quellcode und Build
COPY client/ ./
RUN npm run build                # → /app/client/dist


###############################################################################
# 2) Backend-Runtime (stage-1)                                                #
###############################################################################
FROM node:18-slim

# ---------- Backend vorbereiten ----------
WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci --omit=dev            # NUR Runtime-Deps (inkl. better-sqlite3)

# restlicher Server-Code
COPY server/ ./

# ---------- Frontend-Bundle einspielen ----
COPY --from=client-build /app/client/dist ./static


###############################################################################
# 3) Entrypoint & Port                                                       #
###############################################################################
COPY server/docker-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 10000
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
