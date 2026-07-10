"""API Key authentication for reseller integrations."""
from fastapi import Request, HTTPException
from sqlalchemy.orm import Session
from models.user import User


async def get_user_by_api_key(request: Request, db: Session) -> User:
    """Extract and validate API key from X-API-Key header."""
    api_key = request.headers.get("X-API-Key")
    if not api_key:
        raise HTTPException(status_code=401, detail="Missing X-API-Key header")
    
    user = db.query(User).filter(User.api_key == api_key).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid API key")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account suspended")
    if not user.is_approved:
        raise HTTPException(status_code=403, detail="Account not yet approved")
    
    return user
