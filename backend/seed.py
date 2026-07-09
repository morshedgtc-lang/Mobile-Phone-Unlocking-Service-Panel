"""Seed script: Create initial super admin account.
Run once: `python seed.py` or `alembic upgrade head && python seed.py`"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from database.session import SessionLocal, engine
from database.base import Base
from models.user import User, UserRole, UserGroup
from models.order import Order, Service, Category
from models.support import SupportTicket, TicketReply, AuditLog, Notification, KYC
from auth.security import Security

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.role == UserRole.SUPER_ADMIN).first()
        if existing:
            print("Super admin already exists. Skipping.")
            return

        admin = User(
            username="admin",
            email="admin@unlockpro.com",
            hashed_password=Security.get_password_hash("Admin@123456"),
            full_name="Super Administrator",
            role=UserRole.SUPER_ADMIN,
            group=UserGroup.RETAIL,
            is_active=True,
            is_verified=True,
            balance=0.0,
        )
        db.add(admin)
        db.commit()
        print("Super admin created successfully!")
        print("  Email: admin@unlockpro.com")
        print("  Password: Admin@123456")
        print("  ** CHANGE THIS PASSWORD IN PRODUCTION **")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
