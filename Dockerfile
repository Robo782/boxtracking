# ---------- Frontend-Build ----------
FROM node:20-alpine AS client-build
WORKDIR /app
COPY client ./client
RUN cd client && npm ci && npm run build

# ---------- Backend ----------
FROM node:20-alpine
WORKDIR /app
COPY server ./server
COPY --from=client-build /app/client/dist ./client/dist
RUN cd server && npm ci --omit dev
ENV NODE_ENV=production PORT=5000
EXPOSE 5000
CMD ["node", "server/server.js"]
