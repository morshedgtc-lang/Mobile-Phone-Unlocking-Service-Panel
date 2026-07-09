from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database.session import get_db
from models.user import User, UserRole
from api.schemas import UserResponse, UserUpdate
from auth.jwt_handler import JWTHandler
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

router = APIRouter(prefix="/users", tags=["Users"])

async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = JWTHandler.decode_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return payload

@router.get("/me", response_model=UserResponse)
def get_me(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = db.query(User).filter(User.email == current_user['sub']).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.patch("/me", response_model=UserResponse)
def update_me(update_in: UserUpdate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = db.query(User).filter(User.email == current_user['sub']).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    for field, value in update_in.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
        
    db.commit()
    db.refresh(user)
    return user
