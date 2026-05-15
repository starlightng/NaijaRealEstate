from fastapi import APIRouter
from sqlalchemy import select

from app.core.dependencies import CurrentUser, AdminUser, DB
from app.core.exceptions import AppError
from app.models.user import User
from app.schemas.user import UserMe, UserUpdate, UserAdminView

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserMe)
async def get_me(current_user: CurrentUser):
    return current_user


@router.put("/me", response_model=UserMe)
async def update_me(body: UserUpdate, current_user: CurrentUser, db: DB):
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    await db.flush()
    await db.refresh(current_user)
    return current_user


@router.get("/{user_id}", response_model=UserAdminView)
async def get_user(user_id: str, _: AdminUser, db: DB):
    from uuid import UUID
    user = await db.scalar(
        select(User).where(User.id == UUID(user_id), User.deleted_at.is_(None))
    )
    if not user:
        raise AppError.USER_NOT_FOUND
    return user


@router.get("/", response_model=list[UserAdminView])
async def list_users(
    _: AdminUser, db: DB,
    role: str | None = None,
    is_active: bool | None = None,
    skip: int = 0, limit: int = 50
):
    query = select(User).where(User.deleted_at.is_(None))
    if role:
        query = query.where(User.role == role)
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    query = query.offset(skip).limit(limit).order_by(User.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.put("/{user_id}/deactivate", status_code=200)
async def deactivate_user(user_id: str, admin: AdminUser, db: DB):
    from uuid import UUID
    user = await db.scalar(select(User).where(User.id == UUID(user_id)))
    if not user:
        raise AppError.USER_NOT_FOUND
    if user.id == admin.id:
        raise AppError.bad_request("You cannot deactivate your own account")
    user.is_active = False
    return {"message": "User deactivated"}


@router.put("/{user_id}/activate", status_code=200)
async def activate_user(user_id: str, _: AdminUser, db: DB):
    from uuid import UUID
    user = await db.scalar(select(User).where(User.id == UUID(user_id)))
    if not user:
        raise AppError.USER_NOT_FOUND
    user.is_active = True
    return {"message": "User activated"}
