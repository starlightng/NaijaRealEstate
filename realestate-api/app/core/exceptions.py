from fastapi import HTTPException, status


class AppError:
    """Centralised HTTP exception factory."""

    # ── Auth ──────────────────────────────────────────────────────────────────
    INVALID_CREDENTIALS = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )
    TOKEN_EXPIRED = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token has expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    INVALID_TOKEN = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    NOT_AUTHENTICATED = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required",
        headers={"WWW-Authenticate": "Bearer"},
    )
    FORBIDDEN = HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to perform this action",
    )
    ACCOUNT_INACTIVE = HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Your account has been deactivated",
    )

    # ── Users ─────────────────────────────────────────────────────────────────
    USER_NOT_FOUND = HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="User not found",
    )
    EMAIL_TAKEN = HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="An account with this email already exists",
    )

    # ── Properties ────────────────────────────────────────────────────────────
    PROPERTY_NOT_FOUND = HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Property not found",
    )
    PROPERTY_NOT_OWNER = HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not own this property",
    )
    MAX_IMAGES_EXCEEDED = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Maximum number of images per property exceeded",
    )

    # ── Inquiries ─────────────────────────────────────────────────────────────
    INQUIRY_NOT_FOUND = HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Inquiry not found",
    )

    # ── Links ─────────────────────────────────────────────────────────────────
    LINK_ALREADY_EXISTS = HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="This agent-landlord relationship already exists",
    )
    LINK_NOT_FOUND = HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Agent-landlord link not found",
    )

    # ── Generic ───────────────────────────────────────────────────────────────
    NOT_FOUND = HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Resource not found",
    )
    BAD_REQUEST = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Bad request",
    )

    @staticmethod
    def validation(detail: str) -> HTTPException:
        return HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)

    @staticmethod
    def bad_request(detail: str) -> HTTPException:
        return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

    @staticmethod
    def forbidden(detail: str) -> HTTPException:
        return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)
