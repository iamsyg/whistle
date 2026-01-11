# app/controllers/message_controller.py

from fastapi import HTTPException
from app.utils.supabase_client import supabase


async def send_message_to_chat(
    sender_id: str,
    chat_id: str,
    content: str
):
    """
    Send a direct message between sender and receiver
    """

    try:

        member_res = supabase.table("chat_members") \
            .select("chat_id") \
            .eq("chat_id", chat_id) \
            .eq("user_id", sender_id) \
            .is_("left_at", None) \
            .execute()
        
        print("Membership check result:", member_res.data)

        if not member_res.data:
            raise HTTPException(status_code=403, detail="Not a member of this chat")

        # 2. Insert message
        msg_res = supabase.table("messages").insert({
            "chat_id": chat_id,
            "sender_id": sender_id,
            "content": content
        }).execute()

        print("Message insert result:", msg_res.data)

        if not msg_res.data:
            raise HTTPException(status_code=500, detail="Failed to send message")

        return msg_res.data[0]
    
    except Exception as e:
        print("Error in send_direct_message:", e)
        raise e



async def get_direct_messages(
    sender_id: str,
    chat_id: str
):
    """
    Fetch all messages in a direct chat between sender and chat_user
    """

    member_res = supabase.table("chat_members") \
        .select("chat_id") \
        .eq("chat_id", chat_id) \
        .eq("user_id", sender_id) \
        .is_("left_at", None) \
        .execute()

    if not member_res.data:
        raise HTTPException(status_code=403, detail="Not a member of this chat")

    messages_res = supabase.table("messages") \
        .select("*") \
        .eq("chat_id", chat_id) \
        .is_("deleted_at", None) \
        .order("created_at", desc=False) \
        .execute()

    return messages_res.data


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
