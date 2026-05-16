from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Query, Response
from sqlalchemy import select, func, or_, literal_column
from sqlalchemy.orm import selectinload

from app.core.dependencies import CurrentUser, LandlordOrAgentUser, DB, OptionalCurrentUser
from app.core.exceptions import AppError
from app.models.property import Property
from app.schemas.property import (
    PropertyCreate, PropertyUpdate, PropertyOut,
    PropertyListItem, PropertyImageOut,
)
from app.schemas.responses import APIResponse, PaginatedResponse
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/properties", tags=["Properties"])

EDITABLE_STATUSES = {"draft", "pending_review", "rejected"}


def _owns_or_manages(prop: Property, user) -> bool:
    return (
        prop.owner_id == user.id
        or prop.agent_id == user.id
        or user.role == "admin"
    )


@router.get("/", response_model=APIResponse[list[PropertyListItem]])
async def list_properties(
    db: DB,
    search: str | None = Query(None, description="Full-text search"),
    city: str | None = None,
    state: str | None = None,
    lga: str | None = None,
    property_type: str | None = None,
    listing_type: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    bedrooms: int | None = None,
    featured: bool | None = None,
    sort: str = "newest",
    amenities: list[str] | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    query = (
        select(Property)
        .options(selectinload(Property.images))
        .where(Property.deleted_at.is_(None), Property.status == "approved")
    )

    if search:
        query = query.where(or_(
            Property.title.ilike(f"%{search}%"),
            Property.description.ilike(f"%{search}%"),
            Property.city.ilike(f"%{search}%"),
            Property.landmark.ilike(f"%{search}%")
        ))
    if city:
        query = query.where(Property.city.ilike(city))
    if state:
        query = query.where(Property.state.ilike(state))
    if lga:
        query = query.where(Property.lga.ilike(lga))
    if property_type:
        query = query.where(Property.property_type == property_type)
    if listing_type:
        query = query.where(Property.listing_type == listing_type)
    if min_price is not None:
        query = query.where(Property.price >= min_price)
    if max_price is not None:
        query = query.where(Property.price <= max_price)
    if bedrooms is not None:
        query = query.where(Property.bedrooms >= bedrooms)
    if featured is not None:
        query = query.where(Property.featured == featured)

    if sort == "price_asc":
        query = query.order_by(Property.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Property.price.desc())
    else:
        query = query.order_by(Property.created_at.desc())

    total = await db.scalar(select(func.count()).select_from(query.subquery())) or 0
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    properties = result.scalars().all()

    items: list[PropertyListItem] = []
    for p in properties:
        primary = next((img.url for img in p.images if img.is_primary), None)
        if not primary and p.images:
            primary = p.images[0].url
        items.append({
            "id": str(p.id),
            "title": p.title,
            "property_type": p.property_type,
            "listing_type": p.listing_type,
            "price": float(p.price),
            "price_period": p.price_period,
            "currency": "₦",
            "bedrooms": p.bedrooms,
            "bathrooms": p.bathrooms,
            "area_sqm": float(p.area_sqm) if p.area_sqm else None,
            "city": p.city,
            "state": p.state,
            "lga": p.lga,
            "landmark": p.landmark,
            "featured": p.featured,
            "status": p.status,
            "view_count": p.view_count,
            "inquiry_count": p.inquiry_count,
            "images": [PropertyImageOut.model_validate(img) for img in p.images],
            "created_at": p.created_at,
        })

    return PaginatedResponse(items=items, total=total, skip=skip, limit=limit)


@router.get("/meta/context", response_model=APIResponse[dict], tags=["Meta"])
async def get_nigerian_context():
    from app.utils.nigeria import (
        CURRENCY_SYMBOL, CURRENCY_CODE, NIGERIAN_STATES, POPULAR_CITIES,
        COMMON_AMENITIES, PROPERTY_TYPES, LISTING_TYPES,
        PRICE_PERIODS, TITLE_DOCUMENTS,
    )
    return APIResponse(data={
        "currency": {"symbol": CURRENCY_SYMBOL, "code": CURRENCY_CODE},
        "states": NIGERIAN_STATES,
        "popular_cities": POPULAR_CITIES,
        "amenities": COMMON_AMENITIES,
        "property_types": PROPERTY_TYPES,
        "listing_types": LISTING_TYPES,
        "price_periods": PRICE_PERIODS,
        "title_documents": TITLE_DOCUMENTS,
    })

@router.get("/stats", response_model=APIResponse[dict], tags=["Meta"])
async def get_public_stats(db: DB):
    """Publicly available stats for the homepage."""
    from app.models.user import User

    total_props = await db.scalar(select(func.count(Property.id)).where(Property.deleted_at.is_(None)))
    total_users = await db.scalar(select(func.count(User.id)).where(User.deleted_at.is_(None), User.role != "admin"))

    # Sum of all view counts across all approved properties
    total_views = await db.scalar(
        select(func.sum(Property.view_count))
        .where(Property.status == "approved", Property.deleted_at.is_(None))
    ) or 0

    return APIResponse(data={
        "total_listings": total_props or 0,
        "total_users": total_users or 0,
        "total_views": total_views,
    })


@router.get("/me/listings", response_model=APIResponse[list[PropertyOut]])
async def my_listings(
    current_user: LandlordOrAgentUser,
    db: DB,
    status: str | None = None,
    skip: int = 0, limit: int = 50,
):
    query = (
        select(Property)
        .options(selectinload(Property.images))
        .where(
            Property.deleted_at.is_(None),
            or_(Property.owner_id == current_user.id, Property.agent_id == current_user.id),
        )
    )
    if status:
        query = query.where(Property.status == status)
    query = query.order_by(Property.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()
    return APIResponse(data=items)


@router.get("/{property_id}", response_model=PropertyOut)
async def get_property(property_id: UUID, db: DB, current_user: OptionalCurrentUser = None):
    prop = await db.scalar(
        select(Property)
        .options(selectinload(Property.images))
        .where(Property.id == property_id, Property.deleted_at.is_(None))
    )
    if not prop:
        raise AppError.PROPERTY_NOT_FOUND
    
    # Allow viewing if approved OR if current user is owner/agent/admin
    can_view = prop.status == "approved"
    if not can_view and current_user:
        can_view = _owns_or_manages(prop, current_user)
    
    if not can_view:
        raise AppError.PROPERTY_NOT_FOUND

    prop.view_count += 1
    await db.flush()
    return prop


@router.post("/", response_model=PropertyOut, status_code=201)
async def create_property(
    body: PropertyCreate,
    current_user: LandlordOrAgentUser,
    db: DB,
):
    from app.utils.nigeria import NIGERIAN_STATES
    if body.state not in NIGERIAN_STATES and body.country == "Nigeria":
        raise AppError.validation(f"'{body.state}' is not a recognised Nigerian state")

    owner_id = None
    agent_id = None

    if current_user.role == "landlord":
        owner_id = current_user.id
    elif current_user.role == "agent":
        agent_id = current_user.id
        # Agents must specify who the owner is if they are listing on behalf of a landlord
        # For now, we check if owner_id is provided in the body
        owner_id = body.owner_id if hasattr(body, 'owner_id') and body.owner_id else None
        if not owner_id:
            # Fallback or error if an agent tries to create a property without an owner
            # For now, we'll let it be null or handle it via a specific business rule
            pass

    prop = Property(
        owner_id=body.owner_id or owner_id or current_user.id,
        agent_id=body.agent_id or agent_id,
        **body.model_dump(exclude={"owner_id", "agent_id"}),
    )
    db.add(prop)
    await db.flush()
    await db.refresh(prop, ["images"])
    return prop


@router.put("/{property_id}", response_model=PropertyOut)
async def update_property(
    property_id: UUID,
    body: PropertyUpdate,
    current_user: LandlordOrAgentUser,
    db: DB,
):
    prop = await db.scalar(
        select(Property)
        .options(selectinload(Property.images))
        .where(Property.id == property_id, Property.deleted_at.is_(None))
    )
    if not prop:
        raise AppError.PROPERTY_NOT_FOUND
    if not _owns_or_manages(prop, current_user):
        raise AppError.PROPERTY_NOT_OWNER
    if prop.status not in EDITABLE_STATUSES and current_user.role != "admin":
        raise AppError.bad_request(
            "Only draft, pending, or rejected listings can be edited"
        )

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(prop, field, value)

    await db.flush()
    await db.refresh(prop)
    return prop


@router.post("/{property_id}/submit", response_model=PropertyOut)
async def submit_for_review(
    property_id: UUID,
    current_user: LandlordOrAgentUser,
    db: DB,
):
    prop = await db.scalar(
        select(Property)
        .options(selectinload(Property.images))
        .where(Property.id == property_id, Property.deleted_at.is_(None))
    )
    if not prop:
        raise AppError.PROPERTY_NOT_FOUND
    if not _owns_or_manages(prop, current_user):
        raise AppError.PROPERTY_NOT_OWNER
    if prop.status != "draft":
        raise AppError.bad_request("Only draft listings can be submitted for review")
    if not prop.images:
        raise AppError.bad_request("Please upload at least one photo before submitting")

    prop.status = "pending_review"
    return prop


@router.delete("/{property_id}", status_code=204)
async def delete_property(
    property_id: UUID,
    current_user: LandlordOrAgentUser,
    db: DB,
):
    prop = await db.scalar(
        select(Property).where(Property.id == property_id, Property.deleted_at.is_(None))
    )
    if not prop:
        raise AppError.PROPERTY_NOT_FOUND
    if not _owns_or_manages(prop, current_user):
        raise AppError.PROPERTY_NOT_OWNER

    prop.deleted_at = datetime.now(timezone.utc)
    return Response(status_code=204)


@router.post("/{property_id}/archive", response_model=PropertyOut)
async def archive_property(
    property_id: UUID,
    current_user: LandlordOrAgentUser,
    db: DB,
):
    prop = await db.scalar(
        select(Property)
        .options(selectinload(Property.images))
        .where(Property.id == property_id, Property.deleted_at.is_(None))
    )
    if not prop:
        raise AppError.PROPERTY_NOT_FOUND
    if not _owns_or_manages(prop, current_user):
        raise AppError.PROPERTY_NOT_OWNER
    
    prop.status = "archived"
    await db.flush()
    return prop


@router.post("/{property_id}/unarchive", response_model=PropertyOut)
async def unarchive_property(
    property_id: UUID,
    current_user: LandlordOrAgentUser,
    db: DB,
):
    prop = await db.scalar(
        select(Property)
        .options(selectinload(Property.images))
        .where(Property.id == property_id, Property.deleted_at.is_(None))
    )
    if not prop:
        raise AppError.PROPERTY_NOT_FOUND
    if not _owns_or_manages(prop, current_user):
        raise AppError.PROPERTY_NOT_OWNER
    
    if prop.status != "archived":
        raise AppError.bad_request("Only archived listings can be unarchived")
    
    # Restore to 'approved' if it was approved before archiving, otherwise 'draft'
    prop.status = "approved" if prop.published_at else "draft"
    await db.flush()
    return prop
