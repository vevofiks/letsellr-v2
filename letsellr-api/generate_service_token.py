#!/usr/bin/env python3
"""
Utility script to generate Service Account Tokens and view Server-to-Server Auth headers for n8n.
"""

import sys
from datetime import datetime, timedelta, UTC
from jose import jwt

from app.core.config import settings


def generate_long_lived_jwt() -> str:
    """Generate a 100-year non-expiring JWT token for machine/service authentication."""
    expire = datetime.now(UTC) + timedelta(days=365 * 100)
    payload = {
        "sub": "n8n-service",
        "type": "service",
        "role": "admin",
        "exp": expire,
        "iat": datetime.now(UTC),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def main():
    print("=" * 60)
    print("      LETSELLR BACKEND — SERVER-TO-SERVER AUTH GENERATOR")
    print("=" * 60)
    print()
    print("Option 1: Static Service API Key (Recommended for n8n)")
    print(f"  N8N_API_KEY: {settings.N8N_API_KEY}")
    print("  n8n Header:")
    print(f"    Authorization: Bearer {settings.N8N_API_KEY}")
    print("    OR")
    print(f"    X-API-Key: {settings.N8N_API_KEY}")
    print()
    print("Option 2: Non-Expiring Service JWT Token (100-Year Validity)")
    token = generate_long_lived_jwt()
    print(f"  Token: {token}")
    print("  n8n Header:")
    print(f"    Authorization: Bearer {token}")
    print()
    print("=" * 60)


if __name__ == "__main__":
    main()
