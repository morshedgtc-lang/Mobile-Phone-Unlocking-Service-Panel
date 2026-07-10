from fastapi import APIRouter, Request, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session, joinedload
from database.session import get_db
from auth.api_key_auth import get_user_by_api_key
from auth.jwt_handler import JWTHandler
from models.user import User, WalletTransaction
from models.order import Order, Service, OrderStatus
from models.api_log import APIRequestLog
from services.upload import upload_image
import json

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)

router = APIRouter(prefix="/api/v1", tags=["Reseller API"])


@router.post("/orders")
async def create_reseller_order(
    request: Request,
    service_id: str = None,
    order_data: dict = None,
    customer_notes: str = None,
    db: Session = Depends(get_db)
):
    body = await request.json()
    service_id = body.get("service_id")
    order_data = body.get("order_data", {})
    customer_notes = body.get("customer_notes")

    user = await get_user_by_api_key(request, db)

    service = db.query(Service).filter(Service.id == service_id, Service.is_active == True).first()
    if not service:
        api_log = APIRequestLog(
            user_id=user.id,
            api_key=request.headers.get("X-API-Key"),
            method="POST",
            path=str(request.url.path),
            status_code=404,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
        db.add(api_log)
        db.commit()
        raise HTTPException(status_code=404, detail="Service not found")

    group = user.group.value if hasattr(user.group, 'value') else user.group
    if group == "distributor":
        price = service.distributor_price
    elif group == "reseller":
        price = service.reseller_price
    elif group == "wholesale":
        price = service.wholesale_price
    elif group == "vip":
        price = service.vip_price
    else:
        price = service.retail_price

    if user.balance < price:
        api_log = APIRequestLog(
            user_id=user.id,
            api_key=request.headers.get("X-API-Key"),
            method="POST",
            path=str(request.url.path),
            status_code=402,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
        db.add(api_log)
        db.commit()
        raise HTTPException(status_code=402, detail="Insufficient balance")

    user.balance -= price
    tx = WalletTransaction(
        user_id=user.id,
        amount=price,
        transaction_type="debit",
        description=f"Order for service: {service.name}",
    )
    db.add(tx)

    order = Order(
        user_id=user.id,
        service_id=service.id,
        status=OrderStatus.PENDING,
        price_paid=price,
        order_data=json.dumps(order_data),
        customer_notes=customer_notes,
    )
    db.add(order)

    api_log = APIRequestLog(
        user_id=user.id,
        api_key=request.headers.get("X-API-Key"),
        method="POST",
        path=str(request.url.path),
        status_code=201,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(api_log)
    db.commit()
    db.refresh(order)

    return {
        "order_id": str(order.id),
        "remaining_balance": user.balance,
        "status": order.status.value,
        "message": "Order created successfully",
    }


@router.get("/orders")
def list_reseller_orders(
    request: Request,
    db: Session = Depends(get_db),
):
    user = None

    api_key = request.headers.get("X-API-Key")
    if api_key:
        user = db.query(User).filter(User.api_key == api_key).first()
        if not user:
            api_log = APIRequestLog(
                api_key=api_key,
                method="GET",
                path=str(request.url.path),
                status_code=401,
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
            )
            db.add(api_log)
            db.commit()
            raise HTTPException(status_code=401, detail="Invalid API key")
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account suspended")
        if not user.is_approved:
            raise HTTPException(status_code=403, detail="Account not yet approved")
    else:
        raise HTTPException(status_code=401, detail="Missing X-API-Key header")

    orders = db.query(Order).filter(Order.user_id == user.id).options(
        joinedload(Order.service)
    ).order_by(Order.created_at.desc()).all()

    result = []
    for order in orders:
        result.append({
            "order_id": str(order.id),
            "service_name": order.service.name if order.service else "Unknown",
            "status": order.status.value,
            "price_paid": order.price_paid,
            "order_data": order.order_data,
            "admin_result": order.admin_result,
            "created_at": order.created_at.isoformat() if order.created_at else None,
        })

    api_log = APIRequestLog(
        user_id=user.id,
        api_key=api_key,
        method="GET",
        path=str(request.url.path),
        status_code=200,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(api_log)
    db.commit()

    return result


@router.get("/orders/{order_id}")
def get_reseller_order_status(
    order_id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    user = None

    api_key = request.headers.get("X-API-Key")
    if api_key:
        user = db.query(User).filter(User.api_key == api_key).first()
        if not user:
            api_log = APIRequestLog(
                api_key=api_key,
                method="GET",
                path=str(request.url.path),
                status_code=401,
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
            )
            db.add(api_log)
            db.commit()
            raise HTTPException(status_code=401, detail="Invalid API key")
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account suspended")
        if not user.is_approved:
            raise HTTPException(status_code=403, detail="Account not yet approved")
    else:
        raise HTTPException(status_code=401, detail="Missing X-API-Key header")

    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == user.id,
    ).first()

    if not order:
        api_log = APIRequestLog(
            user_id=user.id,
            api_key=api_key,
            method="GET",
            path=str(request.url.path),
            status_code=404,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
        db.add(api_log)
        db.commit()
        raise HTTPException(status_code=404, detail="Order not found")

    api_log = APIRequestLog(
        user_id=user.id,
        api_key=api_key,
        method="GET",
        path=str(request.url.path),
        status_code=200,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(api_log)
    db.commit()

    return {
        "order_id": str(order.id),
        "status": order.status.value,
        "price_paid": order.price_paid,
        "order_data": order.order_data,
        "admin_result": order.admin_result,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "updated_at": order.updated_at.isoformat() if order.updated_at else None,
    }


@router.get("/services")
def list_reseller_services(
    request: Request,
    db: Session = Depends(get_db),
):
    user = None

    api_key = request.headers.get("X-API-Key")
    if api_key:
        user = db.query(User).filter(User.api_key == api_key).first()
        if not user:
            api_log = APIRequestLog(
                api_key=api_key,
                method="GET",
                path=str(request.url.path),
                status_code=401,
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
            )
            db.add(api_log)
            db.commit()
            raise HTTPException(status_code=401, detail="Invalid API key")
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account suspended")
        if not user.is_approved:
            raise HTTPException(status_code=403, detail="Account not yet approved")
    else:
        raise HTTPException(status_code=401, detail="Missing X-API-Key header")

    services = db.query(Service).filter(Service.is_active == True).all()

    result = []
    for svc in services:
        result.append({
            "id": str(svc.id),
            "name": svc.name,
            "description": svc.description,
            "reseller_price": svc.reseller_price,
            "distributor_price": svc.distributor_price,
            "processing_time": svc.processing_time,
            "requirements": svc.requirements,
        })

    api_log = APIRequestLog(
        user_id=user.id,
        api_key=api_key,
        method="GET",
        path=str(request.url.path),
        status_code=200,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(api_log)
    db.commit()

    return result


@router.post("/upload")
async def upload_photo(
    request: Request,
    file: UploadFile = File(...),
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    user = None
    api_key = request.headers.get("X-API-Key")

    # Try API key auth first
    if api_key:
        user = db.query(User).filter(User.api_key == api_key).first()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid API key")
    # Fall back to JWT auth (for frontend use)
    elif token:
        payload = JWTHandler.decode_token(token)
        if payload and payload.get("sub"):
            user = db.query(User).filter(User.email == payload["sub"]).first()

    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account suspended")

    url = await upload_image(file)

    api_log = APIRequestLog(
        user_id=user.id,
        api_key=api_key,
        method="POST",
        path="/api/v1/upload",
        status_code=200,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(api_log)
    db.commit()

    return {"url": url}


@router.get("/balance")
def get_reseller_balance(
    request: Request,
    db: Session = Depends(get_db),
):
    user = None

    api_key = request.headers.get("X-API-Key")
    if api_key:
        user = db.query(User).filter(User.api_key == api_key).first()
        if not user:
            api_log = APIRequestLog(
                api_key=api_key,
                method="GET",
                path=str(request.url.path),
                status_code=401,
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
            )
            db.add(api_log)
            db.commit()
            raise HTTPException(status_code=401, detail="Invalid API key")
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account suspended")
        if not user.is_approved:
            raise HTTPException(status_code=403, detail="Account not yet approved")
    else:
        raise HTTPException(status_code=401, detail="Missing X-API-Key header")

    api_log = APIRequestLog(
        user_id=user.id,
        api_key=api_key,
        method="GET",
        path=str(request.url.path),
        status_code=200,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(api_log)
    db.commit()

    return {
        "balance": user.balance,
        "group": user.group.value if hasattr(user.group, 'value') else user.group,
        "is_approved": user.is_approved,
    }
