"""
models/__init__.py
Import all models here so Alembic can detect them for migrations.
"""
from .base import Base
from .user import User
from .property import Property, PropertyImage
from .inquiry import Inquiry, LeadTimeline
from .token import RefreshToken, EmailVerification, PasswordResetToken
from .link import AgentLandlordLink
from .notification import Notification
from .saved import SavedProperty
from .audit import AuditLog

__all__ = [
    "Base",
    "User",
    "Property",
    "PropertyImage",
    "Inquiry",
    "LeadTimeline",
    "LeadStatus",
    "RefreshToken",
    "EmailVerification",
    "PasswordResetToken",
    "AgentLandlordLink",
    "Notification",
    "SavedProperty",
    "AuditLog",
]
