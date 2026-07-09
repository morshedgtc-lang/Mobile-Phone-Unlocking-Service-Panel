from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from pydantic import BaseModel
from datetime import datetime

from database.session import get_db
from models.user import User, WalletTransaction, ReloadRequest
from auth.jwt_handler import JWTHandler
from fastapi.security import OAuth2PasswordBearer
from api.schemas import WalletTransactionResponse

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

router = APIRouter(prefix="/wallet", tags=["Wallet"])

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

class ReloadRequestCreate(BaseModel):
    amount: float
    description: str = ""

class ReloadRequestResponse(BaseModel):
    id: str
    user_id: str
    user_email: str = ""
    amount: float
    status: str
    admin_notes: str = ""
    created_at: datetime

    class Config:
        from_attributes = True

class ReloadAction(BaseModel):
    action: str  # approve or reject
    admin_notes: str = ""

@router.get("/transactions", response_model=List[WalletTransactionResponse])
def get_transactions(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = db.query(User).filter(User.email == current_user['sub']).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return db.query(WalletTransaction).filter(
        WalletTransaction.user_id == user.id
    ).order_by(WalletTransaction.created_at.desc()).all()

@router.get("/reload-requests", response_model=List[ReloadRequestResponse])
def get_my_reload_requests(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = db.query(User).filter(User.email == current_user['sub']).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    requests = db.query(ReloadRequest).filter(
        ReloadRequest.user_id == user.id
    ).order_by(ReloadRequest.created_at.desc()).all()
    return requests

@router.post("/reload-request")
def create_reload_request(req: ReloadRequestCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = db.query(User).filter(User.email == current_user['sub']).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    reload_req = ReloadRequest(
        user_id=user.id,
        amount=req.amount,
        status="pending"
    )
    db.add(reload_req)
    db.commit()
    return {"message": "Reload request submitted for admin approval", "amount": req.amount}

# Admin endpoints
@router.get("/admin/reload-requests", response_model=List[ReloadRequestResponse])
def admin_get_reload_requests(db: Session = Depends(get_db), admin: dict = Depends(get_admin_user)):
    requests = db.query(ReloadRequest).order_by(ReloadRequest.created_at.desc()).all()
    # Attach user email
    result = []
    for r in requests:
        u = db.query(User).filter(User.id == r.user_id).first()
        result.append({
            "id": str(r.id),
            "user_id": str(r.user_id),
            "user_email": u.email if u else "",
            "amount": r.amount,
            "status": r.status,
            "admin_notes": r.admin_notes or "",
            "created_at": r.created_at
        })
    return result

@router.post("/admin/reload-request/{request_id}")
def handle_reload_request(request_id: str, action: ReloadAction, db: Session = Depends(get_db), admin: dict = Depends(get_admin_user)):
    reload_req = db.query(ReloadRequest).filter(ReloadRequest.id == request_id).first()
    if not reload_req:
        raise HTTPException(status_code=404, detail="Reload request not found")
    if reload_req.status != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")
    
    admin_user = db.query(User).filter(User.email == admin['sub']).first()
    
    if action.action == "approve":
        reload_req.status = "approved"
        user = db.query(User).filter(User.id == reload_req.user_id).first()
        if user:
            user.balance += reload_req.amount
            tx = WalletTransaction(
                user_id=user.id,
                amount=reload_req.amount,
                transaction_type="credit",
                description=action.admin_notes or "Admin approved reload request",
                created_by=admin_user.id if admin_user else None
            )
            db.add(tx)
        reload_req.admin_notes = action.admin_notes
    elif action.action == "reject":
        reload_req.status = "rejected"
        reload_req.admin_notes = action.admin_notes or "Reload request rejected"
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'approve' or 'reject'")
    
    db.commit()
    return {"message": f"Reload request {action.action}d successfully"}

@router.post("/admin/credit/{user_id}")
def admin_credit_user(user_id: str, amount: float, description: str = "", db: Session = Depends(get_db), admin: dict = Depends(get_admin_user)):
    admin_user = db.query(User).filter(User.email == admin['sub']).first()
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.balance += amount
    tx = WalletTransaction(
        user_id=user.id,
        amount=amount,
        transaction_type="credit",
        description=description or "Manual credit by admin",
        created_by=admin_user.id if admin_user else None
    )
    db.add(tx)
    db.commit()
    return {"message": f"Credited ${amount} to user", "new_balance": user.balance}
