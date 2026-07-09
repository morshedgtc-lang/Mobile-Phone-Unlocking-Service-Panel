FROM python:3.12-slim

RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY frontend/ ./frontend/
WORKDIR /app/frontend
RUN npm install --legacy-peer-deps && npm run build && cp -r public/* out/
WORKDIR /app

COPY app.py .
COPY backend/ ./backend/

CMD uvicorn app:app --host 0.0.0.0 --port $PORT
