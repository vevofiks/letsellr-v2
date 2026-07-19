import asyncio
from app.core.supabase import get_supabase_client

async def test():
    supabase = get_supabase_client()
    try:
        res = supabase.auth.admin.generate_link({
            "type": "magiclink",
            "email": "brandnewuser12345@example.com",
            "data": {
                "name": "Test User",
                "role": "user"
            }
        })
        print("Worked!", res.properties.email_otp)
        print("User role:", res.user.user_metadata)
    except Exception as e:
        print("ERROR:", type(e), e)

asyncio.run(test())
