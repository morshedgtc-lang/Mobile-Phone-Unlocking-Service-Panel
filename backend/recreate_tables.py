"""Drop and recreate all tables, then seed."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from database.session import engine
from database.base import Base
from models.user import User, UserRole, UserGroup
from models.order import Order, Service, Category
from models.support import SupportTicket, TicketReply, AuditLog, Notification, KYC

print("Dropping all tables...")
Base.metadata.drop_all(bind=engine)
print("Creating all tables...")
Base.metadata.create_all(bind=engine)
print("Done!")
