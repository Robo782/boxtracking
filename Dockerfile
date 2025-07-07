###############################################################################
# 1) Frontend-Build (Vite)                                                    #
###############################################################################
FROM node:18 AS client-build

WORKDIR /app/client
# Nur die Paketdateien zuerst – besserer Docker-Cache
COPY client/package*.json ./
RUN npm ci --omit=dev     # nur prod-Abhängigkeiten

# Source-Code kopieren und Build ausführen
COPY client/. .
RUN npm run build         # Vite legt Output unter /app/client/dist

###############################################################################
# 2) Backend + fertiges Frontend                                              #
###############################################################################
FROM node:18

# ---------- Backend vorbereiten ----------
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/. .

# ---------- Vite-Build ins Backend kopieren ----------
#       wir legen es in server/static  ➜ Express liefert es aus
RUN mkdir -p static
COPY --from=client-build /app/client/dist ./static

# ---------- Start ----------
CMD ["node", "server.js"]
