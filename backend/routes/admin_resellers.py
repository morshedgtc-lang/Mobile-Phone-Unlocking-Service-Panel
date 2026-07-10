from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func as sa_func
from database.session import get_db
from models.user import User, UserRole, UserGroup, ReloadRequest, WalletTransaction, generate_api_key
from models.order import Order, OrderStatus
from auth.jwt_handler import JWTHandler
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

router = APIRouter(prefix="/admin", tags=["Admin Resellers"])


def get_admin(token: str = Depends(oauth2_scheme)):
    payload = JWTHandler.decode_token(token)
    if not payload or payload.get("role") not in ["super_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return payload


def get_super_admin(token: str = Depends(oauth2_scheme)):
    payload = JWTHandler.decode_token(token)
    if not payload or payload.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    return payload


@router.get("/resellers")
def list_resellers(db: Session = Depends(get_db), admin: dict = Depends(get_admin)):
    users = db.query(User).filter(
        User.group.in_([UserGroup.RESELLER, UserGroup.DISTRIBUTOR])
    ).order_by(User.created_at.desc()).all()

    result = []
    for u in users:
        order_count = db.query(sa_func.count(Order.id)).filter(Order.user_id == u.id).scalar() or 0
        total_spent = db.query(sa_func.sum(Order.price_paid)).filter(Order.user_id == u.id).scalar() or 0.0
        result.append({
            "id": str(u.id),
            "username": u.username,
            "email": u.email,
            "group": u.group.value,
            "api_key": u.api_key,
            "is_approved": u.is_approved,
            "is_active": u.is_active,
            "balance": u.balance,
            "order_count": order_count,
            "total_spent": float(total_spent),
            "created_at": u.created_at.isoformat() if u.created_at else None,
        })

    return result


@router.post("/resellers/{user_id}/approve")
def approve_reseller(user_id: str, db: Session = Depends(get_db), admin: dict = Depends(get_super_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_api_key = generate_api_key()
    user.is_approved = True
    user.approved_at = sa_func.now()
    user.api_key = new_api_key
    user.api_key_created_at = sa_func.now()

    db.commit()

    return {
        "message": "Reseller approved successfully",
        "api_key": new_api_key,
    }


@router.post("/resellers/{user_id}/revoke-key")
def revoke_reseller_key(user_id: str, db: Session = Depends(get_db), admin: dict = Depends(get_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_api_key = generate_api_key()
    user.api_key = new_api_key
    user.api_key_created_at = sa_func.now()

    db.commit()

    return {
        "message": "API key regenerated successfully",
        "api_key": new_api_key,
    }


@router.get("/deposits")
def list_deposits(db: Session = Depends(get_db), admin: dict = Depends(get_admin)):
    requests = db.query(ReloadRequest).order_by(ReloadRequest.created_at.desc()).all()

    result = []
    for r in requests:
        u = db.query(User).filter(User.id == r.user_id).first()
        result.append({
            "id": str(r.id),
            "user_id": str(r.user_id),
            "user_email": u.email if u else "",
            "amount": r.amount,
            "status": r.status,
            "payment_method": r.payment_method,
            "reference_number": r.reference_number,
            "payment_proof": r.payment_proof,
            "admin_notes": r.admin_notes or "",
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })

    return result


@router.post("/deposits/{request_id}/approve")
def approve_deposit(request_id: str, db: Session = Depends(get_db), admin: dict = Depends(get_admin)):
    reload_req = db.query(ReloadRequest).filter(ReloadRequest.id == request_id).first()
    if not reload_req:
        raise HTTPException(status_code=404, detail="Deposit request not found")
    if reload_req.status != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")

    admin_user = db.query(User).filter(User.email == admin['sub']).first()

    reload_req.status = "approved"
    user = db.query(User).filter(User.id == reload_req.user_id).first()
    if user:
        user.balance += reload_req.amount
        tx = WalletTransaction(
            user_id=user.id,
            amount=reload_req.amount,
            transaction_type="credit",
            description=f"Deposit approved - {reload_req.payment_method or 'N/A'} - Ref: {reload_req.reference_number or 'N/A'}",
            created_by=admin_user.id if admin_user else None,
        )
        db.add(tx)

    db.commit()

    return {"message": "Deposit approved and balance credited"}


@router.post("/deposits/{request_id}/reject")
def reject_deposit(request_id: str, admin_notes: str = "", db: Session = Depends(get_db), admin: dict = Depends(get_admin)):
    reload_req = db.query(ReloadRequest).filter(ReloadRequest.id == request_id).first()
    if not reload_req:
        raise HTTPException(status_code=404, detail="Deposit request not found")
    if reload_req.status != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")

    reload_req.status = "rejected"
    reload_req.admin_notes = admin_notes or "Deposit request rejected"

    db.commit()

    return {"message": "Deposit request rejected"}


@router.get("/stats")
def dashboard_stats(db: Session = Depends(get_db), admin: dict = Depends(get_admin)):
    total_resellers = db.query(sa_func.count(User.id)).filter(
        User.group.in_([UserGroup.RESELLER, UserGroup.DISTRIBUTOR])
    ).scalar() or 0

    approved_resellers = db.query(sa_func.count(User.id)).filter(
        User.group.in_([UserGroup.RESELLER, UserGroup.DISTRIBUTOR]),
        User.is_approved == True,
    ).scalar() or 0

    pending_approvals = db.query(sa_func.count(User.id)).filter(
        User.group.in_([UserGroup.RESELLER, UserGroup.DISTRIBUTOR]),
        User.is_approved == False,
    ).scalar() or 0

    pending_deposits = db.query(sa_func.count(ReloadRequest.id)).filter(
        ReloadRequest.status == "pending"
    ).scalar() or 0

    pending_orders = db.query(sa_func.count(Order.id)).filter(
        Order.status.in_([OrderStatus.PENDING, OrderStatus.WAITING])
    ).scalar() or 0

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_orders = db.query(sa_func.count(Order.id)).filter(
        Order.created_at >= today_start
    ).scalar() or 0

    total_orders = db.query(sa_func.count(Order.id)).scalar() or 0

    total_revenue = db.query(sa_func.sum(Order.price_paid)).scalar() or 0.0

    return {
        "total_resellers": total_resellers,
        "approved_resellers": approved_resellers,
        "pending_approvals": pending_approvals,
        "pending_deposits": pending_deposits,
        "pending_orders": pending_orders,
        "today_orders": today_orders,
        "total_orders": total_orders,
        "total_revenue": float(total_revenue),
    }
