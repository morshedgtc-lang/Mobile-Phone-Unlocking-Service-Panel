from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database.session import get_db
from auth.security import Security
from auth.jwt_handler import JWTHandler
from api.schemas import UserResponse, UserCreate
from services.core import UserService
from models.user import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    return UserService.create_user(db, user_in)

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    try:
        logger.info(f"Login attempt for: {form_data.username}")
        user = db.query(User).filter(User.email == form_data.username).first()
        
        if not user:
            logger.warning(f"User not found: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        if not Security.verify_password(form_data.password, user.hashed_password):
            logger.warning(f"Wrong password for: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        access_token = JWTHandler.create_access_token(data={"sub": user.email, "role": user.role.value})
        refresh_token = JWTHandler.create_refresh_token(data={"sub": user.email})
        
        logger.info(f"Login successful for: {form_data.username}")
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "username": user.username,
                "email": user.email,
                "role": user.role.value,
                "group": user.group.value,
                "balance": user.balance,
                "is_approved": user.is_approved,
                "api_key": user.api_key,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during login"
        )

@router.post("/logout")
def logout():
    return {"message": "Successfully logged out"}
