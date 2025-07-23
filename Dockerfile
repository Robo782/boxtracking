###############################################################################
# 1) Frontend-Build (unverändert)                                             #
###############################################################################
FROM node:18 AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/. .
RUN npm run build

###############################################################################
# 2) Backend Layer                                                            #
###############################################################################
FROM node:18
WORKDIR /app/server

# --- Backend deps ---
COPY server/package*.json ./
RUN npm ci
COPY server/. .

# --- Vite bundle ---
COPY --from=client-build /app/client/dist ./static

# --- Entry-Script ---
COPY server/docker-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# --- kein USER node mehr hier! ---
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# --- Start ---
ENTRYPOINT ["sh", "/usr/local/bin/entrypoint.sh"]
