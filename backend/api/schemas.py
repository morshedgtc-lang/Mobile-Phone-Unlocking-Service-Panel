from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime
from enum import Enum

# User Schema
class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    USER = "user"

class UserGroup(str, Enum):
    RETAIL = "retail"
    WHOLESALE = "wholesale"
    VIP = "vip"
    RESELLER = "reseller"
    DISTRIBUTOR = "distributor"

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: Optional[str] = None
    group: UserGroup = UserGroup.RETAIL

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    group: Optional[UserGroup] = None
    is_active: Optional[bool] = None
    balance: Optional[float] = None

class UserResponse(UserBase):
    id: UUID
    role: UserRole
    balance: float
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Service Schema
class ServiceBase(BaseModel):
    name: str
    description: Optional[str] = None
    retail_price: float
    wholesale_price: float
    vip_price: float
    reseller_price: float
    distributor_price: float
    wholesale_cost: float
    processing_time: str
    requirements: str
    sort_order: int = 0

class ServiceCreate(ServiceBase):
    category_id: UUID

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    retail_price: Optional[float] = None
    wholesale_price: Optional[float] = None
    vip_price: Optional[float] = None
    reseller_price: Optional[float] = None
    distributor_price: Optional[float] = None
    wholesale_cost: Optional[float] = None
    processing_time: Optional[str] = None
    requirements: Optional[str] = None
    is_active: Optional[bool] = None
    maintenance_mode: Optional[bool] = None
    sort_order: Optional[int] = None

class ServiceResponse(ServiceBase):
    id: UUID
    category_id: UUID
    is_active: bool
    maintenance_mode: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Category Schema
class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    sort_order: int = 0

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

class CategoryResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    sort_order: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Order Schema
class OrderStatus(str, Enum):
    PENDING = "pending"
    WAITING = "waiting"
    PROCESSING = "processing"
    COMPLETED = "completed"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
    HOLD = "hold"

class OrderCreate(BaseModel):
    service_id: UUID
    order_data: dict # JSON containing IMEI, etc.
    customer_notes: Optional[str] = None

class ServiceInfo(BaseModel):
    id: UUID
    name: str

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: UUID
    user_id: UUID
    service_id: UUID
    service: Optional[ServiceInfo] = None
    status: OrderStatus
    price_paid: float
    order_data: str # JSON string
    customer_notes: Optional[str] = None
    admin_notes: Optional[str] = None
    admin_result: Optional[str] = None  # JSON: unlock key/instructions
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Wallet Schema
class WalletTransactionResponse(BaseModel):
    id: UUID
    user_id: UUID
    amount: float
    transaction_type: str
    description: str
    created_at: datetime

    class Config:
        from_attributes = True
