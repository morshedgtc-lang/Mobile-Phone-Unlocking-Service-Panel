from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging

from routes import auth, users, orders, services, wallet, support, admin_routes, notifications, reseller_api, admin_resellers
from security.middleware import RateLimiter

logger = logging.getLogger(__name__)

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

@app.on_event("startup")
def startup_event():
    try:
        from database.session import engine
        from database.base import Base
        from database.session import SessionLocal
        from models.user import User, UserRole, UserGroup
        from models.order import Order, Service, Category
        from models.support import SupportTicket, TicketReply, AuditLog, Notification, KYC
        from auth.security import Security

        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/verified")

        db = SessionLocal()
        try:
            existing = db.query(User).filter(User.email == "admin@unlock.com").first()
            if not existing:
                admin = User(
                    username="admin",
                    email="admin@unlock.com",
                    hashed_password=Security.get_password_hash("Admin@123456!"),
                    full_name="Super Administrator",
                    role=UserRole.SUPER_ADMIN,
                    group=UserGroup.WHOLESALE,
                    is_active=True,
                    is_verified=True,
                    is_approved=True,
                    balance=0.0,
                )
                db.add(admin)
                db.commit()
                logger.info("Admin user created: admin@unlock.com / Admin@123456!")
            else:
                logger.info("Admin user already exists")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Startup seed error: {e}", exc_info=True)

# Register Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(orders.router)
app.include_router(services.router)
app.include_router(wallet.router)
app.include_router(support.router)
app.include_router(admin_routes.router)
app.include_router(notifications.router)
app.include_router(reseller_api.router)
app.include_router(admin_resellers.router)

@app.get("/")
async def root():
    return {"message": "Welcome to the Mobile Phone Unlocking Service API", "status": "running"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
