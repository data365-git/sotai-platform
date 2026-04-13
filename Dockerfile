FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD npx prisma migrate deploy && npx next start -p ${PORT:-3000}
