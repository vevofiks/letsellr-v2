import asyncio
from app.db.session import async_session
from sqlalchemy import select
from app.modules.properties.models import Property
import uuid

async def test():
    async with async_session() as db:
        prop_id = uuid.UUID("4a6fb65b-b1d3-4d63-993d-76dafe0f7e55")
        result = await db.execute(select(Property).where(Property.id == prop_id))
        prop = result.scalar_one_or_none()
        if prop:
            print("Property ID:", prop.id)
            print("Owner ID:", prop.owner_id)
            print("Status:", prop.status)
        else:
            print("Not found")

asyncio.run(test())
