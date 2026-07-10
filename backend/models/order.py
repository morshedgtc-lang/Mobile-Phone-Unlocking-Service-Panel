import uuid
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Text, Boolean, Integer, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base, GUID, enum_values
import enum

class OrderStatus(enum.Enum):
    PENDING = "pending"
    WAITING = "waiting"
    PROCESSING = "processing"
    COMPLETED = "completed"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
    HOLD = "hold"

class Category(Base):
    __tablename__ = "categories"

    id = Column(GUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    services = relationship("Service", back_populates="category")

class Service(Base):
    __tablename__ = "services"

    id = Column(GUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id = Column(GUID(as_uuid=True), ForeignKey("categories.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    
    # Pricing for different groups
    retail_price = Column(Float, nullable=False)
    wholesale_price = Column(Float, nullable=False)
    vip_price = Column(Float, nullable=False)
    reseller_price = Column(Float, nullable=False)
    distributor_price = Column(Float, nullable=False)
    
    wholesale_cost = Column(Float, nullable=False) # What admin pays
    
    processing_time = Column(String) # e.g., "1-3 Days"
    requirements = Column(Text) # e.g., "IMEI, Country"
    
    is_active = Column(Boolean, default=True)
    maintenance_mode = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    category = relationship("Category", back_populates="services")
    orders = relationship("Order", back_populates="service")

class Order(Base):
    __tablename__ = "orders"

    id = Column(GUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    service_id = Column(GUID(as_uuid=True), ForeignKey("services.id"), nullable=False)
    
    status = Column(Enum(OrderStatus, values_callable=enum_values), default=OrderStatus.PENDING, nullable=False)
    price_paid = Column(Float, nullable=False)
    
    # Dynamic data submitted by user
    order_data = Column(Text, nullable=False) # JSON string of IMEI, etc.
    
    admin_notes = Column(Text)
    customer_notes = Column(Text)
    admin_result = Column(Text)  # JSON: unlock key, instructions, etc.
    lock_photo = Column(String, nullable=True)  # File path to lock screen photo
    mdm_photo = Column(String, nullable=True)   # File path to MDM screen photo
    error_photo = Column(String, nullable=True)  # File path to error screen photo
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="orders")
    service = relationship("Service", back_populates="orders")
