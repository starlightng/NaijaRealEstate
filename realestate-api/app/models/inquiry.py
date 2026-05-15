import enum
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
import uuid

from sqlalchemy import (
    String,
    Text,
    DateTime,
    ForeignKey,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

if TYPE_CHECKING:
    from .property import Property
    from .user import User


class Inquiry(Base):
    __tablename__ = "inquiries"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, index=True, default=uuid.uuid4)
    property_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sender_name: Mapped[str] = mapped_column(String(255), nullable=False)
    sender_email: Mapped[str] = mapped_column(String(255), nullable=False)
    sender_phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    
    inquiry_type: Mapped[str] = mapped_column(String(20), nullable=False, default="general")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="new")
    priority: Mapped[str] = mapped_column(String(10), nullable=False, default="normal")
    
    assigned_to: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    replied_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    follow_up_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    property: Mapped["Property"] = relationship(
        "Property",
        back_populates="inquiries",
    )

    assignee: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[assigned_to],
        back_populates="assigned_inquiries",
    )

    timeline_events: Mapped[List["LeadTimeline"]] = relationship(
        "LeadTimeline",
        back_populates="inquiry",
        cascade="all, delete-orphan",
        order_by="LeadTimeline.created_at",
    )

    def __repr__(self) -> str:
        return f"<Inquiry id={self.id} status={self.status}>"


class LeadTimeline(Base):
    __tablename__ = "lead_timelines"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, index=True, default=uuid.uuid4)
    inquiry_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("inquiries.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    note: Mapped[Optional[str]] = mapped_column(Text)
    created_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    inquiry: Mapped["Inquiry"] = relationship(
        "Inquiry",
        back_populates="timeline_events",
    )

    created_by: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="timeline_events",
    )

    def __repr__(self) -> str:
        return f"<LeadTimeline inquiry_id={self.inquiry_id} type={self.event_type}>"
