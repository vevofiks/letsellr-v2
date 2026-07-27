import asyncio
import sys
import argparse 
import logging
from sqlalchemy import select
import app.db.registry  # noqa: F401
from app.db.session import AsyncSessionLocal
from app.core.supabase import get_supabase_client
from app.modules.users.models import User

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("create_admin")

async def create_admin_user(email: str, password: str, name: str, phone: str):
    logger.info("Creating admin user: %s", email)
    
    # 1. Supabase Auth Admin Creation
    supabase = get_supabase_client()
    auth_uid = None
    
    try:
        # Check if user exists in Supabase
        users_res = supabase.auth.admin.list_users()
        existing_sub_user = next((u for u in users_res if u.email == email), None)
        
        if existing_sub_user:
            logger.info("User %s already exists in Supabase Auth (UID: %s). Updating password...", email, existing_sub_user.id)
            auth_uid = existing_sub_user.id
            supabase.auth.admin.update_user_by_id(auth_uid, {
                "password": password,
                "email_confirm": True,
                "user_metadata": {"name": name, "role": "admin"}
            })
        else:
            logger.info("Creating new user %s in Supabase Auth...", email)
            res = supabase.auth.admin.create_user({
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {"name": name, "role": "admin"}
            })
            if hasattr(res, "user") and res.user:
                auth_uid = res.user.id
            else:
                raise Exception("Failed to get user from Supabase create_user response.")
    except Exception as e:
        logger.error("Supabase Admin user creation error: %s", e)
        sys.exit(1)

    logger.info("Supabase Auth user ready. UID: %s", auth_uid)

    # 2. Local Database User Record Creation/Update
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user:
            logger.info("Updating existing DB record for %s to admin role...", email)
            user.role = "admin"
            user.name = name
            user.auth_provider_uid = auth_uid
            user.email_verified = True
            user.verification_status = "verified"
            user.status = "active"
        else:
            logger.info("Creating new local DB record for admin %s...", email)
            user = User(
                auth_provider_uid=auth_uid,
                role="admin",
                name=name,
                email=email,
                email_verified=True,
                phone=phone,
                preference_type="admin",
                location_city="Main HQ",
                location_area="Central",
                verification_status="verified",
                status="active"
            )
            db.add(user)

        await db.commit()
        logger.info("Successfully created/updated Admin user in local Database!")
        print("\n==========================================")
        print("🎉 ADMIN ACCOUNT CREATED SUCCESSFULLY!")
        print(f"   Email:    {email}")
        print(f"   Password: {password}")
        print(f"   Role:     admin")
        print("==========================================\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create or elevate a user to Admin role.")
    parser.add_argument("--email", default="admin@letsellr.com", help="Admin email address")
    parser.add_argument("--password", default="Admin123!@#", help="Admin password")
    parser.add_argument("--name", default="System Administrator", help="Admin full name")
    parser.add_argument("--phone", default="+919876543210", help="Admin phone number")

    args = parser.parse_args()
    asyncio.run(create_admin_user(args.email, args.password, args.name, args.phone))
    