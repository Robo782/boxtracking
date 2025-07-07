###############################################################################
# 1) Frontend-Build (separate Stage)                                          #
###############################################################################
FROM node:18 AS client-build

WORKDIR /app
COPY client ./client

# install + build nur im client-Ordner
RUN cd client && npm ci && npm run build


###############################################################################
# 2) Backend + fertiges Frontend                                              #
###############################################################################
FROM node:18

# ---------- Backend ----------
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/. .

# ---------- Frontend-Build kopieren ----------
#   build kommt aus der ersten Stage und landet in /app/server/static
COPY --from=client-build /app/client/build ./static

# ---------- Start ----------
CMD ["node", "server.js"]
