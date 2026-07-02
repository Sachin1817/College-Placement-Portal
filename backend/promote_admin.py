import asyncio
import sys
from sqlalchemy.future import select
from backend.app.database import AsyncSessionLocal
from backend.app.models import User

async def promote_user_to_admin(email: str):
    """
    Finds a user by email and promotes them to admin, setting is_verified = True.
    """
    print(f"Connecting to database to promote '{email}' to admin...")
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"Error: User with email '{email}' not found.")
            return False
            
        user.role = "admin"
        user.is_verified = True
        
        try:
            await db.commit()
            print(f"Success: User '{email}' has been promoted to Admin and verified.")
            return True
        except Exception as e:
            await db.rollback()
            print(f"Failed to commit changes: {str(e)}")
            return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python promote_admin.py <user_email>")
        sys.exit(1)
        
    email_arg = sys.argv[1]
    asyncio.run(promote_user_to_admin(email_arg))
