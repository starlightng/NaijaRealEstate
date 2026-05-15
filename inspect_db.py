from sqlalchemy import create_async_engine, select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
import asyncio
import os
import json

# Fetch DATABASE_URL from environment or use a default
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:password@db:5432/naijaproperty")
# Since I'm running this on the host, 'db' won't resolve. I need to use 'localhost'.
DATABASE_URL = DATABASE_URL.replace("@db:", "@localhost:")

engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession)

async def check_db():
    async with AsyncSessionLocal() as session:
        try:
            # Query all properties
            result = await session.execute(text("SELECT id, title, status, deleted_at FROM properties"))
            rows = result.fetchall()
            print(f"Total properties in DB: {len(rows)}")
            for row in rows:
                print(f"ID: {row[0]}, Title: {row[1]}, Status: {row[2]}, DeletedAt: {row[3]}")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_db())
