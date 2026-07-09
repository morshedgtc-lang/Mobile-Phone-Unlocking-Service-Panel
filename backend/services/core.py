from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.user import User, UserRole, UserGroup, WalletTransaction
from models.order import Order, Service, OrderStatus
from api.schemas import UserCreate, OrderCreate
from auth.security import Security
import json

class UserService:
    @staticmethod
    def create_user(db: Session, user_in: UserCreate, role: UserRole = UserRole.USER):
        db_user = db.query(User).filter(User.email == user_in.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        hashed_pw = Security.get_password_hash(user_in.password)
        user = User(
            username=user_in.username,
            email=user_in.email,
            hashed_password=hashed_pw,
            full_name=user_in.full_name,
            group=user_in.group,
            role=role
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def update_balance(db: Session, user_id: str, amount: float, tx_type: str, description: str, admin_id: str = None):
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if tx_type == "debit" and user.balance < amount:
            raise HTTPException(status_code=400, detail="Insufficient balance")
        
        if tx_type == "credit" or tx_type == "refund":
            user.balance += amount
        elif tx_type == "debit":
            user.balance -= amount
            
        transaction = WalletTransaction(
            user_id=user_id,
            amount=amount,
            transaction_type=tx_type,
            description=description,
            created_by=admin_id
        )
        db.add(transaction)
        db.commit()
        return user

class OrderService:
    @staticmethod
    def create_order(db: Session, user_id: str, order_in: OrderCreate):
        service = db.query(Service).filter(Service.id == order_in.service_id).first()
        if not service or not service.is_active or service.maintenance_mode:
            raise HTTPException(status_code=400, detail="Service currently unavailable")
        
        user = db.query(User).filter(User.id == user_id).first()
        
        # Determine price based on user group
        price = getattr(service, f"{user.group.value}_price", service.retail_price)
        
        if user.balance < price:
            raise HTTPException(status_code=400, detail="Insufficient balance")
        
        # Deduct balance and create order atomically in one transaction
        user.balance -= price
        transaction = WalletTransaction(
            user_id=user_id,
            amount=price,
            transaction_type="debit",
            description=f"Order for {service.name}"
        )
        db.add(transaction)
        
        order = Order(
            user_id=user_id,
            service_id=service.id,
            status=OrderStatus.PENDING,
            price_paid=price,
            order_data=json.dumps(order_in.order_data),
            customer_notes=order_in.customer_notes
        )
        db.add(order)
        db.commit()
        db.refresh(order)
        return order
