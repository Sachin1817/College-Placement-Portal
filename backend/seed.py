"""
Seed script — creates the default admin account on a fresh database.
Run once after migrations:
    $env:PYTHONPATH="."; .venv\Scripts\python backend/seed.py
"""
import asyncio
from sqlalchemy.future import select
from backend.app.database import AsyncSessionLocal
from backend.app.models import User
from backend.app.auth import hash_password

# ──────────────────────────────────────────────
# Change these before going to production!
ADMIN_EMAIL    = "admin@placement.edu"
ADMIN_PASSWORD = "Admin@1234"
# ──────────────────────────────────────────────

async def seed():
    async with AsyncSessionLocal() as db:
        exists = await db.execute(select(User).where(User.email == ADMIN_EMAIL))
        if exists.scalar_one_or_none():
            print(f"Admin '{ADMIN_EMAIL}' already exists — skipping.")
            return

        admin = User(
            email=ADMIN_EMAIL,
            password_hash=hash_password(ADMIN_PASSWORD),
            role="admin",
            is_verified=True,
        )
        db.add(admin)
        await db.commit()
        print("=" * 50)
        print("  Admin account created successfully!")
        print(f"  Email   : {ADMIN_EMAIL}")
        print(f"  Password: {ADMIN_PASSWORD}")
        print("  [!] Change the password after first login.")
        print("=" * 50)

asyncio.run(seed())
