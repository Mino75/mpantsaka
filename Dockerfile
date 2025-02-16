FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY server.js README.md ./

CMD ["node", "server.js"]
