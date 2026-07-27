import asyncio
from app.db.session import engine
from sqlalchemy import text

async def main():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN msg_limit INTEGER NOT NULL DEFAULT 3;"))
            print("Added msg_limit")
        except Exception as e:
            print(f"msg_limit error: {e}")
            
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN msg_usage INTEGER NOT NULL DEFAULT 0;"))
            print("Added msg_usage")
        except Exception as e:
            print(f"msg_usage error: {e}")

asyncio.run(main())
