"""
Covers the atomic usage-increment endpoint used by the WhatsApp bot to
enforce a user's paid enquiry quota.

The old implementation did `user.msg_usage += 1; await db.commit()` -- a
read-then-write with no row lock, so two concurrent enquiries from the same
phone number (e.g. a customer pasting two property links a few seconds
apart) could both read the same stale count and both slip past the limit.

This test proves the fix by actually racing real concurrent DB sessions
against each other, not by reasoning about the code in the abstract -- each
"request" gets its own AsyncSessionLocal(), exactly like two real concurrent
HTTP requests each get their own session via FastAPI's get_db dependency.
"""

import asyncio
import uuid

import pytest

from app.db.session import AsyncSessionLocal
from app.modules.auth.router import increment_usage
from app.modules.auth.schemas import UsageIncrementResponse
from app.modules.users.models import User


class _FakeAdmin:
    """Just needs a `.role` attribute -- increment_usage only checks that."""

    role = "admin"


@pytest.mark.asyncio
async def test_concurrent_increments_never_exceed_the_limit():
    phone = f"+91900000{uuid.uuid4().int % 10000:04d}"
    limit = 3

    # This user must be genuinely committed (not left inside the test's
    # rolled-back `db` fixture transaction) so the concurrent sessions below,
    # each on their own connection, can actually see it.
    async with AsyncSessionLocal() as setup_db:
        user = User(
            phone=phone,
            name="Race Test User",
            role="user",
            preference_type="buy",
            location_city="",
            location_area="",
            verification_status="none",
            status="active",
            msg_limit=limit,
            msg_usage=0,
        )
        setup_db.add(user)
        await setup_db.commit()

    try:
        concurrency = 10

        async def one_request() -> UsageIncrementResponse:
            async with AsyncSessionLocal() as db:
                return await increment_usage(
                    current_user=_FakeAdmin(), db=db, phone=phone
                )

        results = await asyncio.gather(*[one_request() for _ in range(concurrency)])

        allowed_count = sum(1 for r in results if r.allowed)
        refused_count = sum(1 for r in results if not r.allowed)

        assert allowed_count == limit, (
            f"expected exactly {limit} of {concurrency} concurrent requests "
            f"to be allowed, got {allowed_count}"
        )
        assert refused_count == concurrency - limit

        async with AsyncSessionLocal() as check_db:
            from sqlalchemy import select

            row = (
                await check_db.execute(select(User).where(User.phone == phone))
            ).scalar_one()
            assert row.msg_usage == limit, (
                f"final msg_usage should land exactly on the limit ({limit}), "
                f"got {row.msg_usage} -- a lost update or an overshoot means "
                f"the increment is not atomic"
            )
    finally:
        async with AsyncSessionLocal() as cleanup_db:
            from sqlalchemy import delete

            await cleanup_db.execute(delete(User).where(User.phone == phone))
            await cleanup_db.commit()


@pytest.mark.asyncio
async def test_increment_creates_new_user_at_usage_one():
    phone = f"+91900001{uuid.uuid4().int % 10000:04d}"
    try:
        async with AsyncSessionLocal() as db:
            result = await increment_usage(
                current_user=_FakeAdmin(), db=db, phone=phone
            )
        assert result.allowed is True
        assert result.msg_usage == 1
        assert result.msg_limit == 3
    finally:
        async with AsyncSessionLocal() as cleanup_db:
            from sqlalchemy import delete

            await cleanup_db.execute(delete(User).where(User.phone == phone))
            await cleanup_db.commit()


@pytest.mark.asyncio
async def test_increment_refused_at_limit_leaves_usage_unchanged():
    phone = f"+91900002{uuid.uuid4().int % 10000:04d}"
    async with AsyncSessionLocal() as setup_db:
        user = User(
            phone=phone,
            name="At Limit User",
            role="user",
            preference_type="buy",
            location_city="",
            location_area="",
            verification_status="none",
            status="active",
            msg_limit=3,
            msg_usage=3,
        )
        setup_db.add(user)
        await setup_db.commit()

    try:
        async with AsyncSessionLocal() as db:
            result = await increment_usage(
                current_user=_FakeAdmin(), db=db, phone=phone
            )
        assert result.allowed is False
        assert result.msg_usage == 3
        assert result.msg_limit == 3
    finally:
        async with AsyncSessionLocal() as cleanup_db:
            from sqlalchemy import delete

            await cleanup_db.execute(delete(User).where(User.phone == phone))
            await cleanup_db.commit()
