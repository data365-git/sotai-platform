FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY . .
RUN npm run build

ENV PORT=3000
EXPOSE 3000

CMD sh -c "npx prisma db push --skip-generate 2>&1 && npx next start -p ${PORT:-3000} 2>&1"
