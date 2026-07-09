from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database.session import get_db
from models.user import User, UserRole, UserGroup
from models.order import Order
from models.support import SupportTicket
from models.support import AuditLog, Notification, KYC
from auth.jwt_handler import JWTHandler
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from datetime import datetime, timedelta
import csv, io

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
router = APIRouter(prefix="/admin", tags=["Admin"])

def get_admin(token: str = Depends(oauth2_scheme)):
    payload = JWTHandler.decode_token(token)
    if not payload or payload.get("role") not in ["super_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return payload

class UserUpdateAdmin(BaseModel):
    group: str = None
    role: str = None
    is_active: bool = None
    balance: float = None
    full_name: str = None

@router.get("/users")
def list_users(db: Session = Depends(get_db), admin: dict = Depends(get_admin)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [{"id": str(u.id), "username": u.username, "email": u.email, "role": u.role.value, "group": u.group.value, "balance": u.balance, "is_active": u.is_active, "created_at": u.created_at} for u in users]

@router.patch("/users/{user_id}")
def update_user(user_id: str, update: UserUpdateAdmin, db: Session = Depends(get_db), admin: dict = Depends(get_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise HTTPException(status_code=404)
    for field, value in update.model_dump(exclude_unset=True).items():
        if value is not None:
            try:
                if field == "group": setattr(user, field, UserGroup(value))
                elif field == "role": setattr(user, field, UserRole(value))
                else: setattr(user, field, value)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid value for {field}: {value}")
    db.commit()
    return {"message": "User updated"}

@router.get("/reports/orders")
def report_orders(days: int = 30, db: Session = Depends(get_db), admin: dict = Depends(get_admin)):
    cutoff = datetime.utcnow() - timedelta(days=days)
    orders = db.query(Order).filter(Order.created_at >= cutoff).all()
    total_revenue = sum(o.price_paid for o in orders)
    return {"total_orders": len(orders), "total_revenue": total_revenue, "orders": [{"id": str(o.id), "status": o.status.value, "price": o.price_paid, "date": o.created_at} for o in orders]}

@router.get("/reports/export-csv")
def export_csv(db: Session = Depends(get_db), admin: dict = Depends(get_admin)):
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "User", "Service", "Status", "Price", "Date"])
    for o in orders:
        writer.writerow([str(o.id), str(o.user_id), str(o.service_id), o.status.value, o.price_paid, o.created_at])
    return {"csv": output.getvalue()}

@router.get("/audit-logs")
def get_audit_logs(db: Session = Depends(get_db), admin: dict = Depends(get_admin)):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()
    return [{"id": str(l.id), "user_id": str(l.user_id) if l.user_id else None, "action": l.action, "resource": l.resource, "details": l.details, "ip": l.ip_address, "created_at": l.created_at} for l in logs]

@router.get("/kyc")
def list_kyc(db: Session = Depends(get_db), admin: dict = Depends(get_admin)):
    kyc = db.query(KYC).order_by(KYC.created_at.desc()).all()
    result = []
    for k in kyc:
        u = db.query(User).filter(User.id == k.user_id).first()
        result.append({"id": str(k.id), "user_id": str(k.user_id), "user_email": u.email if u else "", "full_name": k.full_name, "status": k.status, "created_at": k.created_at})
    return result

@router.post("/kyc/{kyc_id}/verify")
def verify_kyc(kyc_id: str, action: str = "approved", db: Session = Depends(get_db), admin: dict = Depends(get_admin)):
    if action not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="Action must be 'approved' or 'rejected'")
    kyc = db.query(KYC).filter(KYC.id == kyc_id).first()
    if not kyc: raise HTTPException(status_code=404)
    kyc.status = action
    if action == "approved":
        user = db.query(User).filter(User.id == kyc.user_id).first()
        if user: user.is_verified = True
    db.commit()
    return {"message": f"KYC {action}"}
