import asyncio
from app.db.session import engine
from app.db.base import Base

# Import all models so Base knows about them
import app.db.registry

async def main():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Missing tables created successfully.")

if __name__ == "__main__":
    asyncio.run(main())
