import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy import select

# Load env before importing app modules
load_dotenv()

from app.database import SessionLocal
from app.models.property import Property
from app.models.user import User

async def check_ownership():
    async with SessionLocal() as db:
        result = await db.execute(select(Property).where(Property.deleted_at.is_(None)))
        props = result.scalars().all()
        
        print(f"{'Title':<30} | {'Owner ID':<40} | {'Agent ID':<40} | {'Status':<15}")
        print("-" * 130)
        for p in props:
            print(f"{p.title[:30]:<30} | {str(p.owner_id):<40} | {str(p.agent_id):<40} | {p.status:<15}")

if __name__ == "__main__":
    asyncio.run(check_ownership())
