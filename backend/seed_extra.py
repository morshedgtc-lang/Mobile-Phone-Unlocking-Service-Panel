"""Seed additional data: categories, services, and a test user."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from database.session import SessionLocal, engine
from database.base import Base
from models.user import User, UserRole, UserGroup
from models.order import Order, Service, Category
from models.support import SupportTicket, TicketReply, AuditLog, Notification, KYC
from auth.security import Security
import uuid

def seed_extra():
    db = SessionLocal()
    try:
        # Check if categories already exist
        existing = db.query(Category).first()
        if existing:
            print("Extra data already seeded. Skipping.")
            return

        # Create category
        cat = Category(name="Phone Unlocking", description="All phone unlock services", sort_order=0)
        db.add(cat)
        db.flush()

        # Create services
        svc1 = Service(
            category_id=cat.id, name="iPhone Unlock", description="Unlock iPhone by IMEI",
            retail_price=25.0, wholesale_price=20.0, vip_price=18.0, reseller_price=15.0,
            distributor_price=12.0, wholesale_cost=10.0, processing_time="1-3 Days",
            requirements="IMEI", is_active=True
        )
        svc2 = Service(
            category_id=cat.id, name="Samsung Galaxy Unlock", description="Unlock Samsung phones by IMEI",
            retail_price=30.0, wholesale_price=22.0, vip_price=20.0, reseller_price=18.0,
            distributor_price=15.0, wholesale_cost=12.0, processing_time="1-2 Days",
            requirements="IMEI Number", is_active=True
        )
        db.add_all([svc1, svc2])
        db.flush()

        # Create test user
        test_user = User(
            username="testuser", email="test@example.com",
            hashed_password=Security.get_password_hash("TestPass123"),
            full_name="Test User", role=UserRole.USER, group=UserGroup.RETAIL,
            is_active=True, balance=75.0
        )
        db.add(test_user)
        db.commit()
        print("Extra seed data created: 1 category, 2 services, 1 test user")
        print("  Test user: test@example.com / TestPass123")
    finally:
        db.close()

if __name__ == "__main__":
    seed_extra()
