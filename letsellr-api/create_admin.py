import asyncio
import sys
import argparse
import logging
from sqlalchemy import select
import app.db.registry  # noqa: F401
from app.db.session import AsyncSessionLocal
from app.modules.users.models import User

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("create_admin")


async def create_admin_user(email: str, password: str, name: str, phone: str):
    logger.info("Creating admin user: %s", email)

    # Local Database User Record Creation/Update
    from app.core.security import hash_password

    hashed_password = hash_password(password)

    async with AsyncSessionLocal() as db:
        from sqlalchemy import or_

        result = await db.execute(
            select(User).where(or_(User.email == email, User.phone == phone))
        )
        user = result.scalars().first()

        if user:
            logger.info("Updating existing DB record for %s to admin role...", email)
            user.role = "admin"
            user.name = name
            user.email = email
            user.phone = phone
            user.auth_provider_uid = hashed_password
            user.email_verified = True
            user.verification_status = "verified"
            user.status = "active"
        else:
            logger.info("Creating new local DB record for admin %s...", email)
            user = User(
                auth_provider_uid=hashed_password,
                role="admin",
                name=name,
                email=email,
                email_verified=True,
                phone=phone,
                preference_type="admin",
                location_city="Main HQ",
                location_area="Central",
                verification_status="verified",
                status="active",
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
    parser = argparse.ArgumentParser(
        description="Create or elevate a user to Admin role."
    )
    parser.add_argument(
        "--email", default="admin@letsellr.in", help="Admin email address"
    )
    parser.add_argument("--password", default="Admin123!@#", help="Admin password")
    parser.add_argument(
        "--name", default="System Administrator", help="Admin full name"
    )
    parser.add_argument("--phone", default="+919876543210", help="Admin phone number")

    args = parser.parse_args()
    asyncio.run(create_admin_user(args.email, args.password, args.name, args.phone))
