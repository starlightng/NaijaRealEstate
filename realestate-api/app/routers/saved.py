
from uuid import UUID

from fastapi import APIRouter, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.dependencies import CurrentUser, DB
from app.core.exceptions import AppError
from app.models.property import Property
from app.models.saved import SavedProperty
from app.schemas.property import PropertyOut

router = APIRouter(prefix="/saved-properties", tags=["Saved Properties"])


@router.get("/", response_model=list[PropertyOut])
async def list_saved_properties(current_user: CurrentUser, db: DB):
    result = await db.execute(
        select(SavedProperty)
        .options(selectinload(SavedProperty.property).selectinload(Property.images))
        .join(Property)
        .where(
            SavedProperty.user_id == current_user.id,
            Property.deleted_at.is_(None),
            Property.status == "approved",
        )
        .order_by(SavedProperty.saved_at.desc())
    )
    return [item.property for item in result.scalars().all()]


@router.get("/ids", response_model=list[UUID])
async def list_saved_property_ids(current_user: CurrentUser, db: DB):
    result = await db.execute(
        select(SavedProperty.property_id).where(SavedProperty.user_id == current_user.id)
    )
    return list(result.scalars().all())


@router.post("/{property_id}", status_code=status.HTTP_201_CREATED)
async def save_property(property_id: UUID, current_user: CurrentUser, db: DB):
    prop = await db.scalar(
        select(Property).where(
            Property.id == property_id,
            Property.status == "approved",
            Property.deleted_at.is_(None),
        )
    )
    if not prop:
        raise AppError.PROPERTY_NOT_FOUND

    existing = await db.scalar(
        select(SavedProperty).where(
            SavedProperty.user_id == current_user.id,
            SavedProperty.property_id == property_id,
        )
    )
    if existing:
        return {"saved": True}

    db.add(SavedProperty(user_id=current_user.id, property_id=property_id))
    return {"saved": True}


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unsave_property(property_id: UUID, current_user: CurrentUser, db: DB):
    saved = await db.scalar(
        select(SavedProperty).where(
            SavedProperty.user_id == current_user.id,
            SavedProperty.property_id == property_id,
        )
    )
    if saved:
        await db.delete(saved)
