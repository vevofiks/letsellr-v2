"""Module: Chat — Router stub (Phase 5)"""

from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def list_chats():
    return {"message": "Chat endpoints — coming in Phase 5"}
