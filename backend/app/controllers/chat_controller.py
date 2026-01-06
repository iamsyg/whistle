# app/controllers/chat_controller.py

from fastapi import HTTPException
from app.utils.supabase_client import supabase


async def send_direct_message(
    sender_id: str,
    receiver_id: str,
    content: str
):
    """
    Send a direct message between sender and receiver
    """

    # 1. Get or create direct chat
    chat_res = supabase.rpc(
        "get_or_create_direct_chat",
        {
            "u1": sender_id,
            "u2": receiver_id,
            "creator": sender_id
        }
    ).execute()

    if not chat_res.data:
        raise HTTPException(status_code=500, detail="Failed to get or create chat")

    chat = chat_res.data
    chat_id = chat["id"]

    # 2. Verify sender is member (safety check)
    member_res =  supabase.table("chat_members") \
        .select("chat_id") \
        .eq("chat_id", chat_id) \
        .eq("user_id", sender_id) \
        .is_("left_at", None) \
        .execute()

    if not member_res.data:
        raise HTTPException(status_code=403, detail="Not a member of this chat")

    # 3. Insert message
    msg_res =  supabase.table("messages").insert({
        "chat_id": chat_id,
        "sender_id": sender_id,
        "content": content
    }).execute()

    if not msg_res.data:
        raise HTTPException(status_code=500, detail="Failed to send message")

    return msg_res.data[0]



async def get_direct_messages(
    sender_id: str,
    chat_user_id: str
):
    """
    Fetch all messages in a direct chat between sender and chat_user
    """

    # 1. Find existing direct chat
    chat_res = supabase.table("chat") \
        .select("id") \
        .eq("type", "direct") \
        .or_(
            f"and(user1.eq.{sender_id},user2.eq.{chat_user_id}),"
            f"and(user1.eq.{chat_user_id},user2.eq.{sender_id})"
        ) \
        .limit(1) \
        .execute()

    # If no conversation → return empty array (same as Mongo logic)
    if not chat_res.data:
        return []

    chat_id = chat_res.data[0]["id"]

    # 2. Verify sender is still a member
    member_res =  supabase.table("chat_members") \
        .select("chat_id") \
        .eq("chat_id", chat_id) \
        .eq("user_id", sender_id) \
        .is_("left_at", None) \
        .execute()

    if not member_res.data:
        raise HTTPException(status_code=403, detail="Not a member of this chat")

    # 3. Fetch messages
    messages_res =  supabase.table("messages") \
        .select("*") \
        .eq("chat_id", chat_id) \
        .is_("deleted_at", None) \
        .order("created_at", desc=False) \
        .execute()

    return messages_res.data
