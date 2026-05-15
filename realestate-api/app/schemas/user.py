from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: str | None = None
    role: str
    avatar_url: str | None = None
    bio: str | None = None


class UserPublic(UserBase):
    """Safe public view — no sensitive fields."""
    id: UUID
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserMe(UserPublic):
    """Extended view for the authenticated user's own profile."""
    is_active: bool
    last_login_at: datetime | None = None


class UserUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    bio: str | None = None
    avatar_url: str | None = None


class UserAdminView(UserPublic):
    """Admin view includes active/deleted status."""
    is_active: bool
    deleted_at: datetime | None = None
    last_login_at: datetime | None = None
