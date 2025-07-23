###############################################################################
# 1) Frontend-Build (Vite)                                                    #
###############################################################################
FROM node:18 AS client-build

WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci          # inkl. devDependencies (Vite)

COPY client/. .
RUN npm run build   # erzeugt /app/client/dist
###############################################################################
# 2) Backend + fertiges Frontend                                              #
###############################################################################
FROM node:18

WORKDIR /app/server

# ── Backend-Abhängigkeiten ───────────────────────────────────────────────────
COPY server/package*.json ./
RUN npm ci
COPY server/. .

# ── gosu nachinstallieren (für das Entry-Script) ────────────────────────────
RUN apt-get update \
  && apt-get install -y --no-install-recommends gosu \
  && rm -rf /var/lib/apt/lists/*

# ── Frontend-Bundle ins Backend kopieren ────────────────────────────────────
COPY --from=client-build /app/client/dist ./static

# ── Entry-Script ────────────────────────────────────────────────────────────
COPY server/docker-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
