"""
Module: Agencies
Re-export AgencyProfile from the users module.
AgencyProfile has a 1-to-1 relationship with User (role='agency').
"""

from app.modules.users.models import AgencyProfile, User  # noqa: F401
