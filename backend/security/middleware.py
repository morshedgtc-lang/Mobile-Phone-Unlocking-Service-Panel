from fastapi import Request
from fastapi.responses import JSONResponse
import time
from collections import defaultdict

class RateLimiter:
    def __init__(self):
        self.requests: dict = defaultdict(list)

    async def __call__(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        minute_ago = now - 60

        self.requests[client_ip] = [t for t in self.requests[client_ip] if t > minute_ago]

        if len(self.requests[client_ip]) > 60:
            return JSONResponse(status_code=429, content={"detail": "Too many requests. Try again later."})

        self.requests[client_ip].append(now)
        response = await call_next(request)
        return response
