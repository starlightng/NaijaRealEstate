import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import (
    String, Boolean, Text, Numeric, SmallInteger, Integer,
    DateTime, ForeignKey, JSON, func, CheckConstraint, UniqueConstraint
)
from sqlalchemy.orm import mapped_column, Mapped, relationship

from .base import Base, UUIDMixin, TimestampMixin

if TYPE_CHECKING:
    from .user import User
    from .inquiry import Inquiry
    from .saved import SavedProperty


class Property(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "properties"

    # ── Ownership ──
    owner_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    agent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id"), index=True
    )

    # ── Core Info ──
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    property_type: Mapped[str] = mapped_column(String(30), nullable=False)
    # house | apartment | room | land | commercial | shortlet | warehouse
    listing_type: Mapped[str] = mapped_column(String(10), nullable=False)
    # rent | sale | lease | shortlet

    # ── Pricing ──
    price: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    price_period: Mapped[str] = mapped_column(
        String(15), nullable=False, default="monthly"
    )  # monthly | yearly | once | per_night
    price_negotiable: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # ── Size ──
    bedrooms: Mapped[Optional[int]] = mapped_column(SmallInteger)
    bathrooms: Mapped[Optional[int]] = mapped_column(SmallInteger)
    toilets: Mapped[Optional[int]] = mapped_column(SmallInteger)
    area_sqm: Mapped[Optional[float]] = mapped_column(Numeric(10, 2))
    floors: Mapped[Optional[int]] = mapped_column(SmallInteger)

    # ── Location ──
    address: Mapped[str] = mapped_column(Text, nullable=False)
    landmark: Mapped[Optional[str]] = mapped_column(String(255))
    lga: Mapped[Optional[str]] = mapped_column(String(100), index=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    state: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    country: Mapped[str] = mapped_column(String(60), nullable=False, default="Nigeria")
    latitude: Mapped[Optional[float]] = mapped_column(Numeric(10, 7))
    longitude: Mapped[Optional[float]] = mapped_column(Numeric(10, 7))

    # ── Amenities (stored as JSON array) ──
    amenities: Mapped[list] = mapped_column(JSON, nullable=False, default=list)

    # ── Media ──
    video_url: Mapped[Optional[str]] = mapped_column(Text)

    # ── Status & Moderation ──
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="draft", index=True
    )
    # draft | pending_review | approved | rejected | archived | rented | sold
    featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    featured_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    rejection_note: Mapped[Optional[str]] = mapped_column(Text)
    moderated_by: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id"))
    moderated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # ── Engagement counters ──
    view_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    inquiry_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # ── Lifecycle timestamps ──
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # ── Relationships ──
    owner: Mapped["User"] = relationship(
        "User", foreign_keys=[owner_id], back_populates="owned_properties"
    )
    agent: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[agent_id], back_populates="managed_properties"
    )
    images: Mapped[List["PropertyImage"]] = relationship(
        "PropertyImage", back_populates="property",
        cascade="all, delete-orphan", order_by="PropertyImage.sort_order"
    )
    inquiries: Mapped[List["Inquiry"]] = relationship(
        "Inquiry", back_populates="property", cascade="all, delete-orphan"
    )
    saved_by: Mapped[List["SavedProperty"]] = relationship(
        "SavedProperty", back_populates="property", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint("bedrooms >= 0", name="ck_prop_bedrooms"),
        CheckConstraint("bathrooms >= 0", name="ck_prop_bathrooms"),
        CheckConstraint("toilets >= 0", name="ck_prop_toilets"),
    )

    def __repr__(self) -> str:
        return f"<Property '{self.title}' [{self.status}]>"


class PropertyImage(Base):
    __tablename__ = "property_images"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    property_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True
    )
    url: Mapped[str] = mapped_column(Text, nullable=False)
    storage_key: Mapped[Optional[str]] = mapped_column(Text)
    caption: Mapped[Optional[str]] = mapped_column(String(255))
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    sort_order: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)
    width: Mapped[Optional[int]] = mapped_column(Integer)
    height: Mapped[Optional[int]] = mapped_column(Integer)
    size_bytes: Mapped[Optional[int]] = mapped_column(Integer)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    property: Mapped["Property"] = relationship("Property", back_populates="images")

    __table_args__ = (
        UniqueConstraint(
            "property_id",
            name="uq_property_images_primary",
            # PostgreSQL partial unique index via Alembic migration (see migration file)
        ),
    )

    def __repr__(self) -> str:
        return f"<PropertyImage property={self.property_id} primary={self.is_primary}>"
