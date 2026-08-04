import asyncio
import sys
import argparse
import logging
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import app.db.registry  # noqa: F401
from app.db.session import AsyncSessionLocal
from app.modules.users.models import User, AgencyProfile
from app.core.security import create_access_token

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("create_test_accounts")


async def create_test_accounts():
    logger.info("Initializing Test Owner and Agency accounts...")

    owner_phone = "+910000000001"
    agency_phone = "+910000000002"

    async with AsyncSessionLocal() as db:
        # 1. Setup Test Owner
        result_owner = await db.execute(select(User).where(User.phone == owner_phone))
        owner_user = result_owner.scalars().first()

        if not owner_user:
            logger.info("Creating new Test Owner...")
            owner_user = User(
                role="owner",
                name="Test Owner",
                phone=owner_phone,
                email="owner@test.com",
                email_verified=True,
                preference_type="residential",
                location_city="Test City",
                location_area="Test Area",
                verification_status="verified",
                status="active",
            )
            db.add(owner_user)
            await db.flush()
        else:
            owner_user.email = "owner@test.com"

        # 2. Setup Test Agency
        result_agency = await db.execute(
            select(User)
            .options(selectinload(User.agency_profile))
            .where(User.phone == agency_phone)
        )
        agency_user = result_agency.scalars().first()

        if not agency_user:
            logger.info("Creating new Test Agency...")
            agency_user = User(
                role="agency",
                name="Test Agency Agent",
                phone=agency_phone,
                email="agency@test.com",
                email_verified=True,
                preference_type="commercial",
                location_city="Test City",
                location_area="Test Area",
                verification_status="verified",
                status="active",
            )
            agency_profile = AgencyProfile(
                user=agency_user,
                display_name="Test Agency LLC",
                about="This is a test agency.",
                areas_served=["Test City"],
            )
            db.add(agency_user)
            db.add(agency_profile)
        else:
            agency_user.email = "agency@test.com"

        await db.commit()
        await db.refresh(owner_user)
        await db.refresh(agency_user)

        # 3. Generate Access Tokens directly (Bypassing OTP)
        owner_token = create_access_token(str(owner_user.id))
        agency_token = create_access_token(str(agency_user.id))

        logger.info("Successfully created/verified test accounts!")
        print("\n=======================================================")
        print("🎉 TEST ACCOUNTS READY!")
        print("=======================================================\n")

        print(f"🏠 OWNER ACCOUNT")
        print(f"   Name:  {owner_user.name}")
        print(f"   Phone: {owner_user.phone}")
        print(f"   Token: {owner_token}")
        print("\n-------------------------------------------------------\n")

        print(f"🏢 AGENCY ACCOUNT")
        print(
            f"   Name:  {agency_user.agency_profile.display_name if agency_user.agency_profile else agency_user.name}"
        )
        print(f"   Phone: {agency_user.phone}")
        print(f"   Token: {agency_token}")
        print("\n=======================================================\n")


if __name__ == "__main__":
    asyncio.run(create_test_accounts())
