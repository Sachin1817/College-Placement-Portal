import asyncio
from sqlalchemy.future import select
from backend.app.database import AsyncSessionLocal
from backend.app.models import User

async def list_users():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        if not users:
            print("No users registered yet.")
        else:
            print(f"{'Email':<40} {'Role':<10} {'Verified'}")
            print("-" * 60)
            for u in users:
                print(f"{u.email:<40} {u.role:<10} {u.is_verified}")

asyncio.run(list_users())
