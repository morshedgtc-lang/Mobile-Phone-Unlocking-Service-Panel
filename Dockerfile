FROM node:20-slim

WORKDIR /app

COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma/

RUN cd backend && npm install && npx prisma generate

COPY backend/ ./backend/

RUN cd backend && npx tsc

EXPOSE 3001

CMD ["sh", "-c", "cd backend && npx prisma db push --skip-generate && node dist/index.js"]
