###############################################################################
# 1) Frontend-Build (Vite)                                                    #
###############################################################################
FROM node:18 AS client-build

WORKDIR /app/client

# 1. Nur package-Dateien kopieren
COPY client/package*.json ./

# 2. ALLE Abhängigkeiten installieren (inkl. devDependencies → Vite!)
RUN npm ci                   #  ←  KEIN  --omit=dev

# 3. Quellcode kopieren und Build ausführen
COPY client/. .
RUN npm run build            # Vite erzeugt /app/client/dist

###############################################################################
# 2) Backend + fertiges Frontend                                              #
###############################################################################
FROM node:18

# ---------- Backend vorbereiten ----------
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/. .

# ---------- Vite-Build ins Backend kopieren ----------
COPY --from=client-build /app/client/dist ./static

# ---------- Start ----------
CMD ["node", "server.js"]
