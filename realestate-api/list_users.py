import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy import select

load_dotenv()

from app.database import SessionLocal
from app.models.user import User

async def list_users():
    async with SessionLocal() as db:
        result = await db.execute(select(User).where(User.deleted_at.is_(None)))
        users = result.scalars().all()
        
        print(f"{'Email':<30} | {'ID':<40} | {'Role':<15}")
        print("-" * 85)
        for u in users:
            print(f"{u.email:<30} | {str(u.id):<40} | {u.role:<15}")

if __name__ == "__main__":
    # Manually set env vars for script since .env is missing them
    os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:password@localhost:5432/naijaproperty"
    os.environ["SECRET_KEY"] = "a_very_secure_random_secret_key_12345"
    asyncio.run(list_users())
