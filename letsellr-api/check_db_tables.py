import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

async def main():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public';"))
        tables = [row[0] for row in result]
        print("Tables in DB:", tables)
        if 'seekers' in tables:
            print("The seekers table EXISTS in the database.")
        else:
            print("The seekers table DOES NOT EXIST in the database.")
    await engine.dispose()

asyncio.run(main())
