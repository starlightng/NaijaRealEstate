import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import mapped_column, Mapped, relationship

from .base import Base, UUIDMixin

if TYPE_CHECKING:
    from .user import User


class AgentLandlordLink(Base):
    __tablename__ = "agent_landlord_links"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    agent_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    landlord_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )  # pending | active | revoked
    invited_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    accepted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    agent: Mapped["User"] = relationship(
        "User", foreign_keys=[agent_id], back_populates="managed_landlords"
    )
    landlord: Mapped["User"] = relationship(
        "User", foreign_keys=[landlord_id], back_populates="managing_agents"
    )

    __table_args__ = (
        UniqueConstraint("agent_id", "landlord_id", name="uq_agent_landlord"),
    )
