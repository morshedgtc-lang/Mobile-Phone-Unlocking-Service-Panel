from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database.session import get_db
from models.support import SupportTicket, TicketReply, TicketPriority, TicketStatus
from models.user import User
from auth.jwt_handler import JWTHandler
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
router = APIRouter(prefix="/support", tags=["Support"])

def get_user(token: str = Depends(oauth2_scheme)):
    payload = JWTHandler.decode_token(token)
    if not payload: raise HTTPException(status_code=401, detail="Invalid token")
    return payload

def get_admin(token: str = Depends(oauth2_scheme)):
    payload = JWTHandler.decode_token(token)
    if not payload or payload.get("role") not in ["super_admin", "admin"]:
        raise HTTPException(status_code=403)
    return payload

class TicketCreate(BaseModel):
    subject: str
    message: str
    priority: str = "medium"

class ReplyCreate(BaseModel):
    message: str

@router.post("/tickets")
def create_ticket(ticket: TicketCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_user)):
    user = db.query(User).filter(User.email == current_user['sub']).first()
    t = SupportTicket(user_id=user.id, subject=ticket.subject, message=ticket.message, priority=TicketPriority(ticket.priority))
    db.add(t); db.commit(); db.refresh(t)
    return {"id": str(t.id), "message": "Ticket created"}

@router.get("/tickets")
def get_tickets(db: Session = Depends(get_db), current_user: dict = Depends(get_user)):
    user = db.query(User).filter(User.email == current_user['sub']).first()
    tickets = db.query(SupportTicket).filter(SupportTicket.user_id == user.id).order_by(SupportTicket.created_at.desc()).all()
    return [{"id": str(t.id), "subject": t.subject, "status": t.status.value, "priority": t.priority.value, "created_at": t.created_at} for t in tickets]

@router.get("/tickets/{ticket_id}")
def get_ticket(ticket_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_user)):
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket: raise HTTPException(status_code=404)
    replies = db.query(TicketReply).filter(TicketReply.ticket_id == ticket_id).order_by(TicketReply.created_at).all()
    return {
        "id": str(ticket.id), "subject": ticket.subject, "message": ticket.message,
        "status": ticket.status.value, "priority": ticket.priority.value,
        "created_at": ticket.created_at,
        "replies": [{"id": str(r.id), "message": r.message, "is_staff": r.is_staff, "created_at": r.created_at} for r in replies]
    }

@router.post("/tickets/{ticket_id}/reply")
def reply_ticket(ticket_id: str, reply: ReplyCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_user)):
    user = db.query(User).filter(User.email == current_user['sub']).first()
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket: raise HTTPException(status_code=404)
    r = TicketReply(ticket_id=ticket.id, user_id=user.id, message=reply.message)
    db.add(r)
    if ticket.status == TicketStatus.CLOSED: ticket.status = TicketStatus.OPEN
    db.commit()
    return {"message": "Reply added"}

# Admin endpoints
@router.get("/admin/tickets")
def admin_tickets(db: Session = Depends(get_db), admin: dict = Depends(get_admin)):
    tickets = db.query(SupportTicket).order_by(SupportTicket.created_at.desc()).all()
    result = []
    for t in tickets:
        u = db.query(User).filter(User.id == t.user_id).first()
        result.append({"id": str(t.id), "subject": t.subject, "status": t.status.value, "priority": t.priority.value, "user_email": u.email if u else "", "created_at": t.created_at})
    return result

@router.post("/admin/tickets/{ticket_id}/status")
def update_ticket_status(ticket_id: str, status_str: str, db: Session = Depends(get_db), admin: dict = Depends(get_admin)):
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket: raise HTTPException(status_code=404)
    try:
        ticket.status = TicketStatus(status_str.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid ticket status: {status_str}")
    db.commit()
    return {"message": f"Status updated to {status_str}"}

@router.post("/tickets/{ticket_id}/close")
def close_ticket(ticket_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_user)):
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket: raise HTTPException(status_code=404)
    ticket.status = TicketStatus.CLOSED
    db.commit()
    return {"message": "Ticket closed"}
