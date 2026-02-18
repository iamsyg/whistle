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
                    "p_metadata": {
                        "type": "text",
                        "payload": {}
                    }
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
            "metadata": rpc_msg.get("metadata") or {},
            "reply_to_id": rpc_msg.get("reply_to_id"),

            "created_at": rpc_msg["created_at"],
            "edited_at": None,
            "deleted_at": None,

            "sender": rpc_msg.get("sender"),   # 🔥 THIS IS THE KEY

            "entities": {
                "tasks": None,
            }
        }

        return message

    except HTTPException:
        raise
    except Exception as e:
        print("❌ send_chat_messages:", e)
        raise HTTPException(500, "Failed to send message")
