FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["sh", "-c", "echo 'Starting Next.js...' && npx next start -p ${PORT:-3000} 2>&1"]
