import asyncio
import app.db.registry
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.modules.users.models import User

async def check():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == "admin@letsellr.com"))
        user = result.scalar_one_or_none()
        if user:
            print("User found:", user.email, "Role:", user.role, "Status:", user.status)
        else:
            print("User not found in DB")

asyncio.run(check())
