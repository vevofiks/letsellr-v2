import asyncio
from uuid import UUID
from app.db.session import AsyncSessionLocal
from app.modules.properties.models import Property
from app.modules.users.models import User
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Property).limit(1))
        prop = result.scalar_one_or_none()
        if not prop:
            print("No property found")
            return
            
        print(f"Found property {prop.id}")
        await session.delete(prop)
        await session.flush()
        # session.commit is missing to test if it's auto-committing
        print("Flushed")
        await session.commit()
        print("Committed")

if __name__ == "__main__":
    asyncio.run(main())
