from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class AuditLogOut(BaseModel):
    id: UUID
    actor_id: UUID
    action: str
    target_type: Optional[str]
    target_id: Optional[UUID]
    before_data: Optional[dict]
    after_data: Optional[dict]
    note: Optional[str]
    ip_address: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
