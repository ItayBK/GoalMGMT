import asyncio
from datetime import datetime, timezone
from sqlmodel import select
from app.core.database import async_session
from app.core.security import hash_password
from app.models.user import User

EMAIL = "admin@example.com"
PASSWORD = "Password123!"

async def create_user():
    async with async_session() as session:
        # Check if already exists
        result = await session.execute(select(User).where(User.email == EMAIL))
        existing_user = result.scalar_one_or_none()

        if existing_user:
            existing_user.hashed_password = hash_password(PASSWORD)
            session.add(existing_user)
            await session.commit()
            print(f"[OK] Existing user updated: {EMAIL}")
        else:
            new_user = User(
                email=EMAIL,
                hashed_password=hash_password(PASSWORD),
                created_at=datetime.now(timezone.utc).replace(tzinfo=None),
            )
            session.add(new_user)
            await session.commit()
            print(f"[OK] New user created: {EMAIL}")

    print("\n--- User Credentials ---")
    print(f"Email:    {EMAIL}")
    print(f"Password: {PASSWORD}")
    print("------------------------\n")

if __name__ == "__main__":
    asyncio.run(create_user())
