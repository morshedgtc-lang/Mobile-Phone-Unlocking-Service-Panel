from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timezone
from database.session import get_db
from models.order import Order, OrderStatus
from models.user import User
from api.schemas import OrderResponse, OrderCreate
from services.core import OrderService
from auth.jwt_handler import JWTHandler
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

router = APIRouter(prefix="/orders", tags=["Orders"])

async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = JWTHandler.decode_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return payload

async def get_admin_user(token: str = Depends(oauth2_scheme)):
    payload = JWTHandler.decode_token(token)
    if not payload or payload.get("role") not in ["super_admin", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return payload

class OrderStatusUpdate(BaseModel):
    status: str
    admin_result: Optional[str] = None  # JSON: unlock key/instructions
    admin_notes: Optional[str] = None

@router.post("", response_model=OrderResponse)
@router.post("/", response_model=OrderResponse)
def create_order(order_in: OrderCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = db.query(User).filter(User.email == current_user['sub']).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    order = OrderService.create_order(db, user.id, order_in)
    return db.query(Order).options(joinedload(Order.service)).filter(Order.id == order.id).first()

@router.get("/my-orders", response_model=List[OrderResponse])
def get_my_orders(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = db.query(User).filter(User.email == current_user['sub']).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return db.query(Order).options(joinedload(Order.service)).filter(Order.user_id == user.id).order_by(Order.created_at.desc()).all()

@router.get("/all", response_model=List[OrderResponse])
def get_all_orders(db: Session = Depends(get_db), admin: dict = Depends(get_admin_user)):
    return db.query(Order).options(joinedload(Order.service)).order_by(Order.created_at.desc()).all()

@router.patch("/{order_id}", response_model=OrderResponse)
def update_order_status(order_id: str, update: OrderStatusUpdate, db: Session = Depends(get_db), admin: dict = Depends(get_admin_user)):
    order = db.query(Order).options(joinedload(Order.service)).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    try:
        order.status = OrderStatus(update.status.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {update.status}")
    if update.admin_result is not None:
        order.admin_result = update.admin_result
    if update.admin_notes is not None:
        order.admin_notes = update.admin_notes
    if order.status == OrderStatus.COMPLETED:
        order.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(order)
    return order
