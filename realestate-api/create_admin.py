import asyncio
import uuid
import sys
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.security import hash_password
from app.models.user import User
from app.config import get_settings

async def promote_to_admin(email: str):
    """
    Finds a user by email and promotes them to the admin role.
    """
    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user:
            print(f"Error: User with email {email} not found.")
            return

        print(f"Promoting {user.email} to admin...")
        user.role = "admin"
        await session.commit()
        print(f"Successfully promoted {email} to administrator!")

async def create_default_admin():
    """
    Creates a hardcoded system admin for initial setup.
    """
    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        admin_email = "admin@naijaproperty.com"
        admin_password = "AdminSecurePassword123!"

        result = await session.execute(select(User).where(User.email == admin_email))
        user = result.scalar_one_or_none()

        if user:
            print(f"Default admin user {admin_email} already exists.")
            return

        print(f"Creating default admin user: {admin_email}...")
        new_admin = User(
            id=uuid.uuid4(),
            email=admin_email,
            password_hash=hash_password(admin_password),
            full_name="System Administrator",
            role="admin",
            is_active=True
        )
        session.add(new_admin)
        await session.commit()
        print("Successfully created default admin user!")
        print(f"Email: {admin_email} | Password: {admin_password}")

async def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python create_admin.py create  - Creates the default system administrator")
        print("  python create_admin.py promote <email> - Promotes an existing user to admin")
        sys.exit(1)

    command = sys.argv[1]
    if command == "create":
        await create_default_admin()
    elif command == "promote" and len(sys.argv) > 2:
        await promote_to_admin(sys.argv[2])
    else:
        print("Invalid command or missing email for promotion.")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as e:
        print(f"Error: {e}")
