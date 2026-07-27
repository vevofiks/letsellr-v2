"""
Database — Model Registry

Import ALL models here so Alembic's autogenerate can detect them.
This file is imported by migrations/env.py.
"""

# NOTE: Add every new model import here. Order doesn't matter.

from app.db.base import Base  # noqa: F401 — re-export for Alembic target_metadata
from app.modules.users.models import User, AgencyProfile  # noqa: F401
from app.modules.properties.models import Property, PropertyType, LocationData, PropertyReport  # noqa: F401
from app.modules.chat.models import Chat, Message  # noqa: F401
from app.modules.admin.models import VerificationRequest  # noqa: F401
from app.modules.reviews.models import Review  # noqa: F401
from app.modules.testimonials.models import Testimonial  # noqa: F401
from app.modules.auth.models import OTPRecord  # noqa: F401
