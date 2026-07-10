"""Railway entrypoint — serves API + built frontend static files."""
import sys
import os
from pathlib import Path

# Ensure backend is importable
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, users, orders, services, wallet, support, admin_routes, notifications
from security.middleware import RateLimiter

ENV = os.getenv("ENV", "production").lower()
ENABLE_DOCS = os.getenv("ENABLE_DOCS", "false").lower() in ("1", "true", "yes")

# CORS: restrict origins when credentials are allowed (wildcard + credentials is invalid)
raw_origins = os.getenv("CORS_ORIGINS", "*")
cors_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]
allow_credentials = raw_origins != "*"

if raw_origins == "*":
    cors_origins = []

docs_url = "/docs" if ENABLE_DOCS else None
redoc_url = "/redoc" if ENABLE_DOCS else None

app = FastAPI(title="Phone Unlock Pro API", version="1.0.0", docs_url=docs_url, redoc_url=redoc_url)


@app.on_event("startup")
def seed_admin():
    from database.session import SessionLocal, engine
    from database.base import Base
    from models.user import User, UserRole, UserGroup
    from auth.security import Security
    try:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        existing = db.query(User).filter(User.role == UserRole.SUPER_ADMIN).first()
        if not existing:
            admin_email = os.getenv("ADMIN_EMAIL")
            admin_password = os.getenv("ADMIN_PASSWORD")
            admin_username = os.getenv("ADMIN_USERNAME", "admin")
            if not admin_email or not admin_password:
                print("WARNING: ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping admin seed")
                db.close()
                return
            db.add(User(
                username=admin_username,
                email=admin_email,
                hashed_password=Security.get_password_hash(admin_password),
                full_name="Super Administrator",
                role=UserRole.SUPER_ADMIN,
                group=UserGroup.RETAIL,
                is_active=True,
                is_verified=True,
                balance=0.0,
            ))
            db.commit()
            print(f"Super admin created: {admin_email}")
        db.close()
    except Exception as e:
        print(f"Seed admin skipped: {e}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.middleware("http")(RateLimiter())

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(orders.router)
app.include_router(services.router)
app.include_router(wallet.router)
app.include_router(support.router)
app.include_router(admin_routes.router)
app.include_router(notifications.router)

@app.get("/health")
def health():
    return {"status": "ok"}

# Redirect root to frontend login
@app.get("/")
def root():
    return RedirectResponse(url="/auth/login")

# Serve built frontend — must be LAST (mount at / catches everything)
frontend_dir = Path(__file__).parent / "frontend" / "out"
if frontend_dir.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")
