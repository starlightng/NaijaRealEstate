from typing import Annotated
from uuid import UUID

from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.core.security import decode_access_token
from app.core.exceptions import AppError

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Extract and validate the JWT from the Authorization header.
    Returns the authenticated User or raises 401.
    """
    token: str | None = None

    # 1. Try Authorization: Bearer header
    if credentials:
        token = credentials.credentials

    # 2. Fallback: try HttpOnly cookie (for browser clients)
    if not token:
        token = request.cookies.get("access_token")

    if not token:
        raise AppError.NOT_AUTHENTICATED

    try:
        payload = decode_access_token(token)
        user_id: str = payload["sub"]
    except (JWTError, KeyError):
        raise AppError.INVALID_TOKEN

    result = await db.execute(
        select(User).where(User.id == UUID(user_id), User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()

    if not user:
        raise AppError.USER_NOT_FOUND
    if not user.is_active:
        raise AppError.ACCOUNT_INACTIVE

    return user
60: 
61: async def get_optional_user(
62:     request: Request,
63:     credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
64:     db: AsyncSession = Depends(get_db),
65: ) -> User | None:
66:     try:
67:         return await get_current_user(request, credentials, db)
68:     except Exception:
69:         return None


# ── Role Guards ───────────────────────────────────────────────────────────────

def require_roles(*roles: str):
    """
    Dependency factory — ensures the current user has one of the given roles.
    """
    async def guard(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            # Log the attempt here in a real production app
            raise AppError.FORBIDDEN
        return current_user

    return Depends(guard)


# ── Typed shorthand dependencies ─────────────────────────────────────────────

CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalCurrentUser = Annotated[User | None, Depends(get_optional_user)]

# Role-specific guards that allow Admin override for all protected routes
AdminUser   = Annotated[User, require_roles("admin")]
AgentUser   = Annotated[User, require_roles("agent", "admin")]
LandlordUser = Annotated[User, require_roles("landlord", "admin")]
LandlordOrAgentUser = Annotated[User, require_roles("landlord", "agent", "admin")]
DB = Annotated[AsyncSession, Depends(get_db)]
