FROM node:18-alpine

WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
RUN npm install --production

COPY . .

VOLUME ["/usr/src/app/wa-session"]

CMD ["node", "index.js"]
