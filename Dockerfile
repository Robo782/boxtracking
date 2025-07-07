# ---- Basis -------------------------------------------------
FROM node:18

# ---- Backend vorbereiten -----------------------------------
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/. .

# ---- Frontend bauen ---------------------------------------
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/. .
RUN npm run build

# ---- Build ins Backend kopieren ---------------------------
WORKDIR /app/server
RUN mkdir -p static && cp -r ../client/build/* static/

# ---- Start -------------------------------------------------
CMD ["node", "server.js"]
