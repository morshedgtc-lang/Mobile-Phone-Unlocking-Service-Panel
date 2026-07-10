#!/bin/bash
set -e

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Installing frontend dependencies..."
cd frontend
npm install

echo "Building frontend..."
npm run build
cp -r public/* out/

echo "Starting server..."
cd ..
uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}
