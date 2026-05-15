from uuid import UUID
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, field_validator


VALID_PROPERTY_TYPES = ("house", "apartment", "room", "land", "commercial", "shortlet", "warehouse")
VALID_LISTING_TYPES = ("rent", "sale", "lease", "shortlet")
VALID_STATUSES = ("draft", "pending_review", "approved", "rejected", "archived", "rented", "sold")


class PropertyImageOut(BaseModel):
    id: UUID
    url: str
    caption: str | None = None
    is_primary: bool
    sort_order: int

    model_config = {"from_attributes": True}


class PropertyCreate(BaseModel):
    title: str
    description: str | None = None
    property_type: str
    listing_type: str
    price: Decimal
    price_period: str = "monthly"
    price_negotiable: bool = False
    bedrooms: int | None = None
    bathrooms: int | None = None
    toilets: int | None = None
    area_sqm: Decimal | None = None
    floors: int | None = None
    address: str
    landmark: str | None = None
    lga: str | None = None
    city: str
    state: str
    country: str = "Nigeria"
    latitude: float | None = None
    longitude: float | None = None
    amenities: list[str] = []
    video_url: str | None = None

    @field_validator("property_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in VALID_PROPERTY_TYPES:
            raise ValueError(f"property_type must be one of {VALID_PROPERTY_TYPES}")
        return v

    @field_validator("listing_type")
    @classmethod
    def validate_listing(cls, v: str) -> str:
        if v not in VALID_LISTING_TYPES:
            raise ValueError(f"listing_type must be one of {VALID_LISTING_TYPES}")
        return v

    @field_validator("price")
    @classmethod
    def validate_price(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("price must be greater than 0")
        return v


class PropertyUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    property_type: str | None = None
    listing_type: str | None = None
    price: Decimal | None = None
    price_period: str | None = None
    price_negotiable: bool | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
    toilets: int | None = None
    area_sqm: Decimal | None = None
    floors: int | None = None
    address: str | None = None
    landmark: str | None = None
    lga: str | None = None
    city: str | None = None
    state: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    amenities: list[str] | None = None
    video_url: str | None = None


class PropertyOut(BaseModel):
    id: UUID
    owner_id: UUID
    agent_id: UUID | None = None
    title: str
    description: str | None = None
    property_type: str
    listing_type: str
    price: Decimal
    price_period: str
    price_negotiable: bool
    bedrooms: int | None = None
    bathrooms: int | None = None
    toilets: int | None = None
    area_sqm: Decimal | None = None
    address: str
    landmark: str | None = None
    lga: str | None = None
    city: str
    state: str
    country: str
    latitude: float | None = None
    longitude: float | None = None
    amenities: list[str]
    video_url: str | None = None
    status: str
    featured: bool
    view_count: int
    inquiry_count: int
    images: list[PropertyImageOut] = []
    published_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PropertyListItem(BaseModel):
    """Lightweight version for browse/search grids."""
    id: UUID
    title: str
    property_type: str
    listing_type: str
    price: Decimal
    price_period: str
    bedrooms: int | None = None
    bathrooms: int | None = None
    area_sqm: Decimal | None = None
    city: str
    state: str
    lga: str | None = None
    status: str
    featured: bool
    view_count: int
    inquiry_count: int
    images: list[PropertyImageOut] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class PropertyAdminOut(PropertyOut):
    rejection_note: str | None = None
    moderated_by: UUID | None = None
    moderated_at: datetime | None = None
