FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD sh -c 'npx prisma db push --accept-data-loss && echo "DB ready, starting Next.js on port ${PORT:-3000}..." && npx next start -p ${PORT:-3000} 2>&1'
