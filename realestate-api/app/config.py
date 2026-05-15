from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    APP_NAME: str = "RealEstate API"
    DEBUG: bool = False
    SECRET_KEY: str                          # Required — set in .env

    # Database
    DATABASE_URL: str                        # Required — set in .env
    # e.g. postgresql+asyncpg://user:pass@localhost:5432/realestate_db

    # JWT
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    ALGORITHM: str = "HS256"

    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    # File uploads
    UPLOAD_DIR: str = "app/uploads"
    MAX_IMAGE_SIZE_MB: int = 5
    MAX_IMAGES_PER_PROPERTY: int = 10

    # Email (stub — fill in when ready)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@realestate.local"


@lru_cache
def get_settings() -> Settings:
    return Settings()
