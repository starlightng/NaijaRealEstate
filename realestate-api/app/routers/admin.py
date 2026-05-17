from uuid import UUID
from pydantic import BaseModel
from datetime import datetime, timezone

from fastapi import APIRouter, Query
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.dependencies import AdminUser, DB
from app.core.exceptions import AppError
from app.models.property import Property
from app.models.user import User
from app.models.audit import AuditLog
from app.models.notification import Notification
from app.schemas.property import PropertyAdminOut
from app.schemas.responses import APIResponse, PaginatedResponse
from app.schemas.auth import RegisterRequest
from app.schemas.user import UserMe
from app.schemas.audit import AuditLogOut

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Analytics ─────────────────────────────────────────────────────────────────

class ReassignRequest(BaseModel):
    owner_id: UUID
    agent_id: UUID | None = None


@router.get("/analytics", response_model=APIResponse[dict])
async def analytics(admin: AdminUser, db: DB):
    """Advanced analytics for administrators."""
    from app.models.user import User
    from sqlalchemy import func
    from datetime import datetime, timezone

    # 1. Basic Counts
    total_props = await db.scalar(select(func.count(Property.id)).where(Property.deleted_at.is_(None)))
    pending_review = await db.scalar(select(func.count(Property.id)).where(Property.status == "pending_review"))
    approved_props = await db.scalar(select(func.count(Property.id)).where(Property.status == "approved"))

    total_users = await db.scalar(select(func.count(User.id)).where(User.deleted_at.is_(None)))
    agents_count = await db.scalar(select(func.count(User.id)).where(User.role == "agent", User.deleted_at.is_(None)))
    landlords_count = await db.scalar(select(func.count(User.id)).where(User.role == "landlord", User.deleted_at.is_(None)))

    # 2. Calculated Metrics (Real Data)
    # Property Performance: Avg Revenue per SqFt
    avg_rev_sqft = await db.scalar(
        select(func.avg(Property.price / Property.area_sqm))
        .where(Property.status == "approved", Property.area_sqm > 0)
    ) or 0

    # Marketing: Conversion Rate & Total Visits
    total_views = await db.scalar(select(func.sum(Property.view_count)).where(Property.deleted_at.is_(None))) or 0
    total_inquiries = await db.scalar(select(func.sum(Property.inquiry_count)).where(Property.deleted_at.is_(None))) or 0
    conversion_rate = (total_inquiries / total_views * 100) if total_views > 0 else 0

    # Operations: Avg Days on Market (Approx based on published_at)
    now = datetime.now(timezone.utc)
    avg_days_on_market = await db.scalar(
        select(func.avg(func.extract('epoch', now - Property.published_at) / 86400))
        .where(Property.status == "approved")
    ) or 0

    # Sales Performance: Listing-to-Sale Ratio
    sold_count = await db.scalar(select(func.count(Property.id)).where(Property.status == "sold")) or 0
    sale_ratio = (sold_count / total_props * 100) if total_props > 0 else 0

    avg_price = await db.scalar(select(func.avg(Property.price)).where(Property.status == "approved")) or 0

    return APIResponse(data={
        "properties": {
            "total": total_props,
            "pending_review": pending_review,
            "approved": approved_props,
            "avg_price": float(avg_price),
            "avg_revenue_per_sqft": float(avg_rev_sqft),
            "sale_ratio": float(sale_ratio),
        },
        "users": {
            "total": total_users,
            "agents": agents_count,
            "landlords": landlords_count,
        },
        "marketing": {
            "total_visits": total_views,
            "total_inquiries": total_inquiries,
            "conversion_rate": float(conversion_rate),
        },
        "operations": {
            "avg_days_on_market": float(avg_days_on_market),
        },
        "financial_benchmarks": {
            "est_roi": "8.5%",
            "est_noi": "12-15%",
            "grm_avg": "10.5x",
            "note": "Financial metrics are currently based on industry benchmarks for Nigeria."
        }
    })


# ── Moderation Queue ──────────────────────────────────────────────────────────

@router.get("/properties/pending", response_model=APIResponse[list[PropertyAdminOut]])
async def pending_listings(
    admin: AdminUser, db: DB,
    skip: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100),
):
    result = await db.execute(
        select(Property)
        .options(selectinload(Property.images))
        .where(Property.status == "pending_review", Property.deleted_at.is_(None))
        .order_by(Property.created_at.asc())
        .offset(skip).limit(limit)
    )
    return APIResponse(data=result.scalars().all())


@router.get("/properties", response_model=APIResponse[list[PropertyAdminOut]])
async def all_listings(
    admin: AdminUser, db: DB,
    status: str | None = None,
    skip: int = 0, limit: int = 50,
):
    query = select(Property).options(selectinload(Property.images)).where(Property.deleted_at.is_(None))
    if status:
        query = query.where(Property.status == status)
    result = await db.execute(query.order_by(Property.created_at.desc()).offset(skip).limit(limit))
    return APIResponse(data=result.scalars().all())


@router.put("/properties/{property_id}/approve", response_model=PropertyAdminOut)
async def approve_listing(property_id: UUID, admin: AdminUser, db: DB):
    prop = await db.scalar(
        select(Property).options(selectinload(Property.images))
        .where(Property.id == property_id, Property.deleted_at.is_(None))
    )
    if not prop:
        raise AppError.PROPERTY_NOT_FOUND

    prop.status = "approved"
    prop.moderated_by = admin.id
    prop.moderated_at = datetime.now(timezone.utc)
    prop.published_at = prop.published_at or datetime.now(timezone.utc)
    prop.rejection_note = None

    db.add(AuditLog(
        actor_id=admin.id, action="approve_listing",
        target_type="property", target_id=property_id,
    ))
    db.add(Notification(
        user_id=prop.owner_id,
        type="listing_approved",
        title="Listing approved",
        body=f"{prop.title} is now visible to buyers and renters.",
        link="/dashboard/landlord",
        data={"property_id": str(prop.id)},
    ))
    return prop


@router.put("/properties/{property_id}/reject", response_model=PropertyAdminOut)
async def reject_listing(property_id: UUID, note: str, admin: AdminUser, db: DB):
    prop = await db.scalar(
        select(Property).options(selectinload(Property.images))
        .where(Property.id == property_id, Property.deleted_at.is_(None))
    )
    if not prop:
        raise AppError.PROPERTY_NOT_FOUND

    prop.status = "rejected"
    prop.moderated_by = admin.id
    prop.moderated_at = datetime.now(timezone.utc)
    prop.rejection_note = note

    db.add(AuditLog(
        actor_id=admin.id, action="reject_listing",
        target_type="property", target_id=property_id,
        note=note,
    ))
    db.add(Notification(
        user_id=prop.owner_id,
        type="listing_rejected",
        title="Listing needs changes",
        body=note,
        link="/dashboard/landlord",
        data={"property_id": str(prop.id)},
    ))
    return prop


@router.put("/properties/{property_id}/feature", status_code=200)
async def toggle_featured(property_id: UUID, featured: bool, admin: AdminUser, db: DB):
    prop = await db.scalar(select(Property).where(Property.id == property_id))
    if not prop:
        raise AppError.PROPERTY_NOT_FOUND
    prop.featured = featured
    db.add(AuditLog(
        actor_id=admin.id, action="feature_listing",
        target_type="property", target_id=property_id,
    ))
    return {"featured": featured}
@router.post("/users", response_model=UserMe)
async def create_user(body: RegisterRequest, admin: AdminUser, db: DB):
    from app.core.security import hash_password
    existing = await db.scalar(select(User).where(User.email == body.email))
    if existing:
        raise AppError.EMAIL_TAKEN
    
    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        full_name=body.full_name,
        phone=body.phone,
        role=body.role,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user

@router.get("/users", response_model=APIResponse[list[UserMe]])
async def list_users(
    admin: AdminUser, db: DB,
    role: str | None = None,
    skip: int = 0, limit: int = 100
):
    query = select(User).where(User.deleted_at.is_(None))
    if role:
        query = query.where(User.role == role)
    
    result = await db.execute(query.order_by(User.full_name.asc()).offset(skip).limit(limit))
    return APIResponse(data=result.scalars().all())

@router.patch("/properties/{property_id}/reassign", response_model=PropertyAdminOut)
async def reassign_property(
    property_id: UUID,
    body: ReassignRequest,
    admin: AdminUser,
    db: DB,
):
    prop = await db.scalar(
        select(Property)
        .options(selectinload(Property.images))
        .where(Property.id == property_id, Property.deleted_at.is_(None))
    )
    if not prop:
        raise AppError.PROPERTY_NOT_FOUND
    
    # Verify new owner exists and can own a listing
    new_owner = await db.get(User, body.owner_id)
    if not new_owner:
        raise AppError.USER_NOT_FOUND
    if new_owner.role not in ("landlord", "agent"):
        raise AppError.bad_request("Properties can only be reassigned to landlords or agents")

    new_agent = None
    if body.agent_id:
        new_agent = await db.get(User, body.agent_id)
        if not new_agent:
            raise AppError.USER_NOT_FOUND
        if new_agent.role != "agent":
            raise AppError.bad_request("Assigned manager must be an agent")
    
    old_owner_id = prop.owner_id
    prop.owner_id = body.owner_id
    prop.agent_id = body.agent_id if new_agent else None
    
    db.add(AuditLog(
        actor_id=admin.id, action="reassign_property",
        target_type="property", target_id=property_id,
        after_data={"old_owner": str(old_owner_id), "new_owner": str(body.owner_id)}
    ))
    
    await db.flush()
    return prop

@router.get("/audit-logs", response_model=list[AuditLogOut])
async def list_audit_logs(
    admin: AdminUser, db: DB,
    skip: int = 0, limit: int = 50
):
    result = await db.execute(
        select(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .offset(skip).limit(limit)
    )
    return result.scalars().all()
