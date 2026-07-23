#!/usr/bin/env python
"""
Uvicorn entry point — run directly for development.

Usage:
  python run.py                    # auto-reload dev mode
  gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker   # production
"""

import uvicorn

if __name__ == "__main__":
    from app.core.config import settings

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port="8000",
        reload=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info",
    )