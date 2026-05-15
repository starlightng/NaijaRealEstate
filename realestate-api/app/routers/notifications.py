
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter
from sqlalchemy import select

from app.core.dependencies import CurrentUser, DB
from app.core.exceptions import AppError
from app.models.notification import Notification

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/")
async def list_notifications(current_user: CurrentUser, db: DB, unread_only: bool = False):
    query = select(Notification).where(Notification.user_id == current_user.id)
    if unread_only:
        query = query.where(Notification.is_read.is_(False))
    result = await db.execute(query.order_by(Notification.created_at.desc()).limit(50))
    return result.scalars().all()


@router.put("/{notification_id}/read")
async def mark_notification_read(notification_id: UUID, current_user: CurrentUser, db: DB):
    notification = await db.scalar(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
    )
    if not notification:
        raise AppError.NOT_FOUND

    notification.is_read = True
    notification.read_at = datetime.now(timezone.utc)
    return {"read": True}
