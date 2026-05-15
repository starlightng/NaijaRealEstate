from datetime import datetime
from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import String, Boolean, DateTime, Text
from sqlalchemy.orm import mapped_column, Mapped, relationship

from .base import Base, UUIDMixin, TimestampMixin

if TYPE_CHECKING:
    from .property import Property
    from .token import RefreshToken, EmailVerification, PasswordResetToken
    from .link import AgentLandlordLink
    from .notification import Notification
    from .inquiry import Inquiry, LeadTimeline
    from .saved import SavedProperty
    from .audit import AuditLog


class User(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(30))
    role: Mapped[str] = mapped_column(
        String(20), nullable=False, index=True
    )  # 'landlord' | 'agent' | 'admin'
    avatar_url: Mapped[Optional[str]] = mapped_column(Text)
    bio: Mapped[Optional[str]] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # ── Relationships ──

    # Properties this user owns (landlord)
    owned_properties: Mapped[List["Property"]] = relationship(
        "Property",
        foreign_keys="Property.owner_id",
        back_populates="owner",
    )

    # Properties this user manages (agent)
    managed_properties: Mapped[List["Property"]] = relationship(
        "Property",
        foreign_keys="Property.agent_id",
        back_populates="agent",
    )

    # Agent side: landlords this agent manages
    managed_landlords: Mapped[List["AgentLandlordLink"]] = relationship(
        "AgentLandlordLink",
        foreign_keys="AgentLandlordLink.agent_id",
        back_populates="agent",
    )

    # Landlord side: agents managing this landlord
    managing_agents: Mapped[List["AgentLandlordLink"]] = relationship(
        "AgentLandlordLink",
        foreign_keys="AgentLandlordLink.landlord_id",
        back_populates="landlord",
    )

    # Auth & security
    refresh_tokens: Mapped[List["RefreshToken"]] = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    email_verifications: Mapped[List["EmailVerification"]] = relationship(
        "EmailVerification",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    password_reset_tokens: Mapped[List["PasswordResetToken"]] = relationship(
        "PasswordResetToken",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # Notifications
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # Saved properties (favorites / watchlist)
    saved_properties: Mapped[List["SavedProperty"]] = relationship(
        "SavedProperty",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # Inquiries assigned to this user (as an agent handling the lead)
    assigned_inquiries: Mapped[List["Inquiry"]] = relationship(
        "Inquiry",
        foreign_keys="Inquiry.assigned_to",
        back_populates="assignee",
    )

    # Timeline events this user created on leads (notes, status changes, follow-ups)
    timeline_events: Mapped[List["LeadTimeline"]] = relationship(
        "LeadTimeline",
        back_populates="created_by",
    )

    # Audit log entries where this user is the actor
    audit_actions: Mapped[List["AuditLog"]] = relationship(
        "AuditLog",
        back_populates="actor",
    )

    def __repr__(self) -> str:
        return f"<User {self.email} [{self.role}]>"
