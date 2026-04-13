FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["sh", "-c", "echo 'ENTRYPOINT START'; npx prisma db push --skip-generate; echo 'PRISMA DONE'; echo 'PORT='${PORT}; npx next start -p ${PORT:-3000}; echo 'NEXT EXITED'"]
