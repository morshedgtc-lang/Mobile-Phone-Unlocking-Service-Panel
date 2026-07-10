import uuid
from sqlalchemy import Column, String, Text, ForeignKey, DateTime, Boolean, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base, GUID, enum_values
import enum

class TicketPriority(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class TicketStatus(enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    WAITING = "waiting"
    RESOLVED = "resolved"
    CLOSED = "closed"

class SupportTicket(Base):
    __tablename__ = "support_tickets"
    id = Column(GUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    subject = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    priority = Column(SAEnum(TicketPriority, values_callable=enum_values), default=TicketPriority.MEDIUM)
    status = Column(SAEnum(TicketStatus, values_callable=enum_values), default=TicketStatus.OPEN)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    user = relationship("User")

class TicketReply(Base):
    __tablename__ = "ticket_replies"
    id = Column(GUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(GUID(as_uuid=True), ForeignKey("support_tickets.id"), nullable=False)
    user_id = Column(GUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    is_staff = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    ticket = relationship("SupportTicket")
    user = relationship("User")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(GUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    resource = Column(String(50))
    resource_id = Column(String(100))
    details = Column(Text)
    ip_address = Column(String(45))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(GUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text)
    type = Column(String(50), default="info")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User")

class KYC(Base):
    __tablename__ = "kyc"
    id = Column(GUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    full_name = Column(String(100))
    id_type = Column(String(50))
    id_number = Column(String(100))
    status = Column(String(20), default="pending")
    admin_notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    user = relationship("User")
