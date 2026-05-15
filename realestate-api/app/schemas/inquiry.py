from uuid import UUID
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr


# ─────────────────────────────────────────────
# Timeline Event (Create)
# ─────────────────────────────────────────────

class TimelineEventCreate(BaseModel):
    event_type: str
    note: Optional[str] = None


# ─────────────────────────────────────────────
# Lead Status Update
# ─────────────────────────────────────────────

class InquiryUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    follow_up_at: Optional[datetime] = None


# ─────────────────────────────────────────────
# Inquiry Creation
# ─────────────────────────────────────────────

class InquiryCreate(BaseModel):
    property_id: UUID
    sender_name: str
    sender_email: EmailStr
    sender_phone: Optional[str] = None
    message: str
    inquiry_type: str = "general"

    class Config:
        str_strip_whitespace = True


# ─────────────────────────────────────────────
# Timeline Event (Response)
# ─────────────────────────────────────────────

class TimelineEventResponse(BaseModel):
    id: UUID
    inquiry_id: UUID
    event_type: str
    note: Optional[str] = None
    created_by_id: Optional[UUID] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────
# Lead Detail Response (Full Inquiry + Timeline)
# ─────────────────────────────────────────────

class LeadDetailResponse(BaseModel):
    id: UUID
    property_id: UUID
    sender_name: str
    sender_email: str
    sender_phone: Optional[str] = None
    message: str
    status: str
    priority: str
    follow_up_at: Optional[datetime] = None
    created_at: datetime
    property_title: Optional[str] = None
    timeline_events: List[TimelineEventResponse]

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────
# General Response for POST creation
# ─────────────────────────────────────────────

class InquiryResponseOut(BaseModel):
    id: UUID
    property_id: UUID
    sender_name: str
    sender_email: str
    status: str
    created_at: datetime
    
    model_config = {"from_attributes": True}
