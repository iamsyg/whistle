# app/controllers/messages/send_chat_messages.py

from fastapi import HTTPException
from app.utils.supabase_client import supabase

async def send_chat_messages(
    sender_id: str,
    chat_id: str,
    content: str
):
    try:
        msg_res = (
            supabase
            .rpc(
                "send_message_rpc",
                {
                    "p_chat_id": chat_id,
                    "p_sender_id": sender_id,
                    "p_content": content,
                },
            )
            .execute()
        )

        print(f"send_chat_messages - RPC response: {msg_res}")

        if not msg_res.data:
            raise HTTPException(500, "Failed to send message")

        rpc_msg = msg_res.data[0]

        print(f"send_chat_messages - RPC message data: {rpc_msg}")

        message = {
            "id": rpc_msg["id"],
            "chat_id": rpc_msg["chat_id"],
            "sender_id": rpc_msg["sender_id"],

            "content": rpc_msg["content"],
            "message_type": rpc_msg.get("message_type", "text"),
            "metadata": rpc_msg.get("metadata"),
            "reply_to_id": rpc_msg.get("reply_to_id"),

            "created_at": rpc_msg["created_at"],
            "edited_at": None,
            "deleted_at": None,

            # "sender": {
            #     "id": rpc_msg["sender"]["id"],

            #     "role": rpc_msg["sender"].get("role"),
            #     "join_via": rpc_msg["sender"].get("join_via"),

            #     "name": rpc_msg["sender"].get("name"),
            #     "avatar_url": rpc_msg["sender"].get("avatar_url"),

            #     "phone_number": rpc_msg["sender"].get("phone_number"),
            #     "username": rpc_msg["sender"].get("username"),

            #     "email": rpc_msg["sender"].get("email"),
            #     "google_name": rpc_msg["sender"].get("google_name"),
            #     "google_avatar": rpc_msg["sender"].get("google_avatar"),
            # },
            "sender": rpc_msg.get("sender"),   # 🔥 THIS IS THE KEY
        }

        return message

    except HTTPException:
        raise
    except Exception as e:
        print("❌ send_chat_messages:", e)
        raise HTTPException(500, "Failed to send message")
