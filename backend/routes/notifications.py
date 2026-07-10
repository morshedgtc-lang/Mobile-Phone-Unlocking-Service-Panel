from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.session import get_db
from models.support import Notification
from models.user import User
from auth.jwt_handler import JWTHandler
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
router = APIRouter(prefix="/notifications", tags=["Notifications"])

def get_user(token: str = Depends(oauth2_scheme)):
    payload = JWTHandler.decode_token(token)
    if not payload: raise HTTPException(status_code=401)
    return payload

@router.get("/")
def list_notifications(db: Session = Depends(get_db), current_user: dict = Depends(get_user)):
    user = db.query(User).filter(User.email == current_user['sub']).first()
    notifs = db.query(Notification).filter(Notification.user_id == user.id).order_by(Notification.created_at.desc()).limit(20).all()
    return [{"id": str(n.id), "title": n.title, "message": n.message, "type": n.type, "is_read": n.is_read, "created_at": n.created_at} for n in notifs]

@router.post("/{notif_id}/read")
def mark_read(notif_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_user)):
    user = db.query(User).filter(User.email == current_user['sub']).first()
    n = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == user.id).first()
    if n: n.is_read = True; db.commit()
    return {"message": "Marked as read"}

@router.post("/read-all")
def mark_all_read(db: Session = Depends(get_db), current_user: dict = Depends(get_user)):
    user = db.query(User).filter(User.email == current_user['sub']).first()
    db.query(Notification).filter(Notification.user_id == user.id, Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"message": "All marked as read"}
