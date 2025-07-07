FROM node:20

WORKDIR /app

COPY server ./server
COPY client ./client

WORKDIR /app/server
RUN npm install

WORKDIR /app/client
RUN npm install && npm run build

WORKDIR /app/server
RUN mkdir -p static && cp -r ../client/build/* static/

CMD ["node", "index.js"]
