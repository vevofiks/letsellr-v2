import asyncio
from app.db.session import AsyncSessionLocal
from app.modules.properties.models import Property
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Property).limit(1))
        prop = result.scalar_one_or_none()
        if not prop:
            print("No properties")
        else:
            print(f"Found: {prop.id}")

if __name__ == "__main__":
    asyncio.run(main())
