# app/controllers/conversation_controller.py

from fastapi import HTTPException
from app.utils.supabase_client import supabase

async def get_or_create_direct_chat_controller(
    sender_id: str,
    other_user_id: str
):
    chat_res = supabase.rpc(
        "get_or_create_direct_chat",
        {
            "u1": sender_id,
            "u2": other_user_id,
            "creator": sender_id
        }
    ).execute()

    if not chat_res.data:
        raise HTTPException(status_code=500, detail="Failed to get or create chat")

    # return chat_res.data

    chat = chat_res.data[0] if isinstance(chat_res.data, list) else chat_res.data
    return chat["id"]