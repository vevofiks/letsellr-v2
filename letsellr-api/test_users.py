import asyncio
import app.main # Load all models
from app.db.session import AsyncSessionLocal
from app.modules.users.models import User
from app.modules.admin.schemas import UserAdminResponse
from sqlalchemy import select
from sqlalchemy.orm import selectinload

async def test():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).options(selectinload(User.agency_profile)))
        users = result.scalars().all()
        for u in users:
            try:
                UserAdminResponse.model_validate(u)
            except Exception as e:
                print(f"Failed on user {u.id} ({u.role}, {u.phone}):")
                print(e)
                print("---")

asyncio.run(test())
