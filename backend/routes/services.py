from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database.session import get_db
from models.order import Service, Category
from api.schemas import ServiceResponse, ServiceCreate, ServiceUpdate, CategoryCreate, CategoryUpdate, CategoryResponse
from auth.jwt_handler import JWTHandler
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

router = APIRouter(prefix="/services", tags=["Services"])

async def get_current_admin(token: str = Depends(oauth2_scheme)):
    payload = JWTHandler.decode_token(token)
    if not payload or payload.get("role") not in ["super_admin", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrator privileges required")
    return payload

@router.get("", response_model=List[ServiceResponse])
@router.get("/", response_model=List[ServiceResponse])
def list_services(db: Session = Depends(get_db)):
    return db.query(Service).filter(Service.is_active == True).all()

@router.get("/all", response_model=List[ServiceResponse])
def list_all_services(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    return db.query(Service).order_by(Service.created_at.desc()).all()

@router.post("", response_model=ServiceResponse)
@router.post("/", response_model=ServiceResponse)
def create_service(service_in: ServiceCreate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    category = db.query(Category).filter(Category.id == service_in.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    service = Service(**service_in.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    return service

@router.patch("/{service_id}", response_model=ServiceResponse)
def update_service(service_id: str, update_in: ServiceUpdate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    for field, value in update_in.model_dump(exclude_unset=True).items():
        setattr(service, field, value)
    db.commit()
    db.refresh(service)
    return service

@router.delete("/{service_id}")
def delete_service(service_id: str, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    service.is_active = False
    db.commit()
    return {"message": "Service deactivated"}

# ─── Category Endpoints ───────────────────────────────────────────

@router.get("/categories", response_model=List[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).filter(Category.is_active == True).order_by(Category.sort_order).all()

@router.get("/categories/all", response_model=List[CategoryResponse])
def list_all_categories(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    return db.query(Category).order_by(Category.sort_order).all()

@router.post("/categories", response_model=CategoryResponse)
def create_category(cat_in: CategoryCreate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    existing = db.query(Category).filter(Category.name == cat_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category name already exists")
    category = Category(**cat_in.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

@router.patch("/categories/{category_id}", response_model=CategoryResponse)
def update_category(category_id: str, update_in: CategoryUpdate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    for field, value in update_in.model_dump(exclude_unset=True).items():
        setattr(category, field, value)
    db.commit()
    db.refresh(category)
    return category

@router.delete("/categories/{category_id}")
def delete_category(category_id: str, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    category.is_active = False
    db.commit()
    return {"message": "Category deactivated"}
