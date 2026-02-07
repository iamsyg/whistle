# app/controllers/messages/send_chat_messages.py

from fastapi import HTTPException
from app.utils.supabase_client import supabase


async def send_chat_messages(
    sender_id: str,
    chat_id: str,
    content: str
):
    """
    Send a message to a chat
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
        print("Error in send_chat_messages:", e)
        raise e