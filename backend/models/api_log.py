import uuid
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Integer
from sqlalchemy.sql import func
from .base import Base, GUID


class APIRequestLog(Base):
    __tablename__ = "api_request_logs"

    id = Column(GUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    api_key = Column(String, nullable=True)
    method = Column(String, nullable=False)
    path = Column(String, nullable=False)
    status_code = Column(Integer, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    request_body = Column(Text, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
