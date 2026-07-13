#!/usr/bin/env bash
set -euo pipefail

echo "=============================================="
echo "  GSM Panel — Railway Production Startup"
echo "=============================================="

echo "[1/3] Prisma db push..."
cd backend
npx prisma db push --skip-generate

echo "[2/3] Starting server on :$PORT..."
exec node dist/index.js
