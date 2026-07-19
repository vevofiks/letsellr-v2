import asyncio
from app.db.session import async_session
from app.modules.properties.repository import PropertyRepository
import uuid

async def test():
    async with async_session() as db:
        repo = PropertyRepository(db)
        prop_id = uuid.UUID("4a6fb65b-b1d3-4d63-993d-76dafe0f7e55")
        prop = await repo.get_by_id(prop_id)
        if prop:
            print("Current status:", prop.status)
            prop = await repo.update(prop, {"status": "live"})
            await db.commit()
            print("New status:", prop.status)
        else:
            print("Property not found")

asyncio.run(test())
