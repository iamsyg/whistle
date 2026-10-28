# app/controllers/messages/send_chat_messages.py

from fastapi import HTTPException
from app.utils.supabase_client import supabase
from app.services.kafka_producer import kafka_producer
from datetime import datetime

async def send_chat_messages(
    sender_id: str,
    chat_id: str,
    content: str
):
    try:
        # Publish to Kafka topic for asynchronous DB persistence
        payload = {
            "chat_id": chat_id,
            "sender_id": sender_id,
            "content": content,
            "metadata": {"type": "text", "payload": {}},
            "created_at": datetime.utcnow().isoformat()
        }
        await kafka_producer.send_chat_message(chat_id, payload)

        message = {
            "chat_id": chat_id,
            "sender_id": sender_id,
            "content": content,
            "message_type": "text",
            "metadata": {"type": "text", "payload": {}},
            "reply_to_id": None,
            "created_at": datetime.utcnow().isoformat(),
            "edited_at": None,
            "deleted_at": None,
            "sender": None,
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
