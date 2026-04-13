FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD sh -c 'npx prisma db push --skip-generate; echo "Prisma exit: $?"; echo "PORT is: ${PORT}"; npx next start -p ${PORT:-3000}'
