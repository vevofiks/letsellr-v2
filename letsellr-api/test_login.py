import asyncio
from app.core.supabase import get_supabase_client

def test():
    supabase = get_supabase_client()
    try:
        res = supabase.auth.sign_in_with_password({
            "email": "admin@letsellr.com",
            "password": "Admin123!@#"
        })
        print("Success!", res.user.email)
    except Exception as e:
        print("Error:", e)

test()
