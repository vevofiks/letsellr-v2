import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect('postgresql://postgres:asjad123@localhost:5432/letsellr_db')
    try:
        await conn.execute('ALTER TABLE reviews ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;')
        print("Successfully added user_id to reviews table.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await conn.close()

if __name__ == '__main__':
    asyncio.run(main())
