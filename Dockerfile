FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM node:20-slim AS backend-builder

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./
RUN npx prisma generate
RUN npm run build

FROM node:20-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
       openssl \
       ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/dist     ./backend/dist
COPY --from=backend-builder /app/backend/prisma   ./backend/prisma

COPY --from=frontend-builder /app/frontend/out/   ./backend/public/

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["sh", "-c", "cd backend && npx prisma db push --skip-generate && node dist/index.js"]
