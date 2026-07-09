from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from routes import auth, users, orders, services, wallet, support, admin_routes, notifications
from security.middleware import RateLimiter

app = FastAPI(
    title="Mobile Phone Unlocking Service API",
    description="Enterprise-grade API for GSM Unlocking Service",
    version="1.0.0",
    docs_url="/docs" if __name__ == "__main__" else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.middleware("http")(RateLimiter())

# Register Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(orders.router)
app.include_router(services.router)
app.include_router(wallet.router)
app.include_router(support.router)
app.include_router(admin_routes.router)
app.include_router(notifications.router)

@app.get("/")
async def root():
    return {"message": "Welcome to the Mobile Phone Unlocking Service API", "status": "running"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
