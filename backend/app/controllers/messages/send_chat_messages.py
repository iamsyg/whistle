# app/controllers/messages/send_chat_messages.py

from fastapi import HTTPException
from app.utils.supabase_client import supabase

async def send_chat_messages(
    sender_id: str,
    chat_id: str,
    content: str
):
    try:
        # Membership check (cheap, indexed)
        member_res = (
            supabase
            .table("chat_members")
            .select("user_id")
            .eq("chat_id", chat_id)
            .eq("user_id", sender_id)
            .is_("left_at", None)
            .limit(1)
            .execute()
        )

        if not member_res.data:
            raise HTTPException(403, "Not a member of this chat")

        # Insert message
        msg_res = (
            supabase
            .table("messages")
            .insert({
                "chat_id": chat_id,
                "sender_id": sender_id,
                "content": content,
            })
            .execute()
        )

        if not msg_res.data:
            raise HTTPException(500, "Failed to send message")

        msg = msg_res.data[0]

        return {
            "id": msg["id"],
            "chat_id": msg["chat_id"],
            "sender_id": msg["sender_id"],
            "content": msg["content"],
            "message_type": msg.get("message_type", "text"),
            "metadata": msg.get("metadata"),
            "reply_to_id": msg.get("reply_to_id"),
            "created_at": msg["created_at"],
            "edited_at": msg.get("edited_at"),
            "deleted_at": None, 
        }

    except HTTPException:
        raise
    except Exception as e:
        print("❌ send_chat_messages:", e)
        raise HTTPException(500, "Failed to send message")
