import uuid
from sqlalchemy import Column, String, Boolean, Float, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base, GUID, enum_values
import enum

class UserRole(enum.Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    USER = "user"

class UserGroup(enum.Enum):
    RETAIL = "retail"
    WHOLESALE = "wholesale"
    VIP = "vip"
    RESELLER = "reseller"
    DISTRIBUTOR = "distributor"

class User(Base):
    __tablename__ = "users"

    id = Column(GUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(Enum(UserRole, values_callable=enum_values), default=UserRole.USER, nullable=False)
    group = Column(Enum(UserGroup, values_callable=enum_values), default=UserGroup.RETAIL, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    balance = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    wallet_transactions = relationship("WalletTransaction", back_populates="user", foreign_keys="WalletTransaction.user_id")
    orders = relationship("Order", back_populates="user")

class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    id = Column(GUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    transaction_type = Column(String, nullable=False) # 'credit', 'debit', 'refund'
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(GUID(as_uuid=True), ForeignKey("users.id"), nullable=True) # Admin who performed it

    user = relationship("User", back_populates="wallet_transactions", foreign_keys="WalletTransaction.user_id")

class ReloadRequest(Base):
    __tablename__ = "reload_requests"

    id = Column(GUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String, default="pending")  # pending, approved, rejected
    admin_notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")
