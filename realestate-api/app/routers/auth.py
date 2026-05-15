from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Response, Request
from sqlalchemy import select

from app.core.dependencies import CurrentUser, DB
from app.core.exceptions import AppError
from app.core.security import (
    hash_password, verify_password,
    create_access_token,
    generate_refresh_token, hash_token, refresh_token_expiry,
    generate_one_time_token,
)
from app.config import get_settings
from app.models.user import User
from app.models.token import RefreshToken, PasswordResetToken
from app.core.email import send_email
from app.schemas.auth import (
    RegisterRequest, LoginRequest, TokenResponse,
    RefreshRequest, PasswordResetRequest, PasswordResetConfirm,
    ChangePasswordRequest,
)
from app.schemas.user import UserMe

# ──────────────────────────────────────────────────────────────────────────────
# Route Constants (Single Source of Truth)
# ──────────────────────────────────────────────────────────────────────────────

class AuthRoutes:
    REGISTER = "/register"
    LOGIN = "/login"
    REFRESH = "/refresh"
    LOGOUT = "/logout"
    ME = "/me"
    FORGOT_PASSWORD = "/forgot-password"
    RESET_PASSWORD = "/reset-password"
    CHANGE_PASSWORD = "/change-password"


settings = get_settings()

# Prefix ensures all routes become /auth/...
router = APIRouter(prefix="/auth", tags=["Auth"])


# ──────────────────────────────────────────────────────────────────────────────
# Register
# ──────────────────────────────────────────────────────────────────────────────

@router.post(AuthRoutes.REGISTER, response_model=UserMe, status_code=201)
async def register(body: RegisterRequest, db: DB):
    existing = await db.scalar(select(User).where(User.email == body.email))
    if existing:
        raise AppError.EMAIL_TAKEN

    if body.role == "admin":
        raise AppError.bad_request("Admin accounts cannot be created via public signup")

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


# ──────────────────────────────────────────────────────────────────────────────
# Login
# ──────────────────────────────────────────────────────────────────────────────

@router.post(AuthRoutes.LOGIN, response_model=TokenResponse)
async def login(body: LoginRequest, response: Response, request: Request, db: DB):
    user = await db.scalar(
        select(User).where(
            User.email == body.email,
            User.deleted_at.is_(None)
        )
    )

    if not user or not verify_password(body.password, user.password_hash):
        raise AppError.INVALID_CREDENTIALS

    if not user.is_active:
        raise AppError.ACCOUNT_INACTIVE

    # Issue tokens
    access_token = create_access_token(str(user.id), user.role)
    raw_refresh = generate_refresh_token()

    db.add(RefreshToken(
        user_id=user.id,
        token_hash=hash_token(raw_refresh),
        expires_at=refresh_token_expiry(),
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    ))

    # Update last login timestamp
    user.last_login_at = datetime.now(timezone.utc)

    # Set HttpOnly refresh cookie
    response.set_cookie(
        key="refresh_token",
        value=raw_refresh,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path=AuthRoutes.REFRESH,
    )

    return TokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


# ──────────────────────────────────────────────────────────────────────────────
# Refresh Token
# ──────────────────────────────────────────────────────────────────────────────

@router.post(AuthRoutes.REFRESH, response_model=TokenResponse)
async def refresh(request: Request, response: Response, db: DB,
                  body: RefreshRequest | None = None):

    raw_token = request.cookies.get("refresh_token") or (body.refresh_token if body else None)
    if not raw_token:
        raise AppError.INVALID_TOKEN

    token_hash = hash_token(raw_token)
    record = await db.scalar(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked.is_(False),
        )
    )

    if not record or record.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise AppError.TOKEN_EXPIRED

    user = await db.get(User, record.user_id)
    if not user or not user.is_active:
        raise AppError.ACCOUNT_INACTIVE

    # Rotate refresh token
    record.revoked = True
    new_raw = generate_refresh_token()

    db.add(RefreshToken(
        user_id=user.id,
        token_hash=hash_token(new_raw),
        expires_at=refresh_token_expiry(),
    ))

    access_token = create_access_token(str(user.id), user.role)

    response.set_cookie(
        key="refresh_token",
        value=new_raw,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path=AuthRoutes.REFRESH,
    )

    return TokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


# ──────────────────────────────────────────────────────────────────────────────
# Logout
# ──────────────────────────────────────────────────────────────────────────────

@router.post(AuthRoutes.LOGOUT, status_code=204)
async def logout(request: Request, response: Response, db: DB):
    raw_token = request.cookies.get("refresh_token")

    if raw_token:
        token_hash = hash_token(raw_token)
        record = await db.scalar(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        if record:
            record.revoked = True

    response.delete_cookie("refresh_token", path=AuthRoutes.REFRESH)


# ──────────────────────────────────────────────────────────────────────────────
# Me
# ──────────────────────────────────────────────────────────────────────────────

@router.get(AuthRoutes.ME, response_model=UserMe)
async def me(current_user: CurrentUser):
    return current_user


# ──────────────────────────────────────────────────────────────────────────────
# Forgot Password
# ──────────────────────────────────────────────────────────────────────────────

@router.post(AuthRoutes.FORGOT_PASSWORD, status_code=202)
async def forgot_password(body: PasswordResetRequest, db: DB):
    user = await db.scalar(
        select(User).where(
            User.email == body.email,
            User.deleted_at.is_(None)
        )
    )

    if user:
        token = generate_one_time_token()
        db.add(PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=2),
        ))

        reset_link = f"http://localhost:3000/auth/reset-password?token={token}"
        await send_email(
            to_email=user.email,
            subject="Password Reset Request",
            body=f"Hello {user.full_name}, you can reset your password by clicking this link: {reset_link}"
        )

    return {"message": "If that email exists, a reset link has been sent."}


# ──────────────────────────────────────────────────────────────────────────────
# Reset Password
# ──────────────────────────────────────────────────────────────────────────────

@router.post(AuthRoutes.RESET_PASSWORD, status_code=200)
async def reset_password(body: PasswordResetConfirm, db: DB):
    record = await db.scalar(
        select(PasswordResetToken).where(
            PasswordResetToken.token == body.token,
            PasswordResetToken.used.is_(False),
        )
    )

    if not record or record.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise AppError.bad_request("Invalid or expired reset token")

    user = await db.get(User, record.user_id)
    if not user:
        raise AppError.USER_NOT_FOUND

    user.password_hash = hash_password(body.new_password)
    record.used = True

    return {"message": "Password updated successfully"}


# ──────────────────────────────────────────────────────────────────────────────
# Change Password
# ──────────────────────────────────────────────────────────────────────────────

@router.post(AuthRoutes.CHANGE_PASSWORD, status_code=200)
async def change_password(body: ChangePasswordRequest, current_user: CurrentUser, db: DB):
    if not verify_password(body.current_password, current_user.password_hash):
        raise AppError.INVALID_CREDENTIALS

    current_user.password_hash = hash_password(body.new_password)
    return {"message": "Password changed successfully"}
