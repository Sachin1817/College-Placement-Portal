"""
Resets a user's password directly in the database.
Usage:
    $env:PYTHONPATH="."; .venv\Scripts\python backend/reset_password.py <email> <new_password>
"""
import asyncio
import sys
from sqlalchemy.future import select
from backend.app.database import AsyncSessionLocal
from backend.app.models import User
from backend.app.auth import hash_password

async def reset_password(email: str, new_password: str):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            print(f"Error: No user found with email '{email}'")
            return
        user.password_hash = hash_password(new_password)
        await db.commit()
        print(f"Password reset successfully for '{email}'")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python reset_password.py <email> <new_password>")
        sys.exit(1)
    asyncio.run(reset_password(sys.argv[1], sys.argv[2]))
