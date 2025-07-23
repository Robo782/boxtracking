###############################################################################
# 1) Frontend-Build (Vite)                                                    #
###############################################################################
FROM node:18-slim AS client-build

WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci          # ALLE deps (inkl. dev) – Vite braucht dev-Deps
COPY client/ .
RUN npm run build   #  => /app/client/dist

###############################################################################
# 2) Backend-Runtime                                                          #
###############################################################################
FROM node:18-slim

# ---------- Backend vorbereiten ----------
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev          # runtime-Deps
COPY server/ .

# ---------- Vite-Bundle einspielen ----------
COPY --from=client-build /app/client/dist ./static

# ---------- Entry-Point ----------
COPY server/docker-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 10000
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
