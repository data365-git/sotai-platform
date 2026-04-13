FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["sh", "-xc", "echo PORT=$PORT; node -e 'console.log(\"Node:\",process.version)'; npx next start -p $PORT"]
