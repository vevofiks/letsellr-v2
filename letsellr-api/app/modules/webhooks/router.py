"""Module: Webhooks — Router stub"""
from fastapi import APIRouter
router = APIRouter()

@router.post("/whatsapp")
async def whatsapp_webhook():
    return {"message": "WhatsApp webhook — coming in Phase 5"}
