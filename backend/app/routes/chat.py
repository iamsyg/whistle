# backend/app/routes/chat.py

import traceback
from fastapi import APIRouter, Depends, Body, HTTPException

from app.controllers.messages.send_chat_messages import send_chat_messages
from app.controllers.messages.get_chat_messages import get_chat_messages

from app.controllers.conversation_controller import get_or_create_direct_chat_controller
from app.middlewares.secure_route import verify_jwt_token
from app.services.websocket_manager import ws_manager

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/send/{chat_id}")
async def send_message_endpoint(
    chat_id: str,
    content: str = Body(..., embed=True),
    sender_id: str = Depends(verify_jwt_token)
):
    """
    Send message to a user (direct chat)
    """

    try: 

        print(f"📤 Sending message to chat {chat_id} from user {sender_id}")

        message = await send_chat_messages(
            sender_id=sender_id,
            chat_id=chat_id,
            content=content
        )

        await ws_manager.broadcast(chat_id, {
            "type": "new_message",
            "data": message
        })

        print(f"✅ Message broadcasted to chat {chat_id}")

        return message
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error sending message: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
    

@router.post("/direct/send/{receiver_id}")
async def send_direct_message_endpoint(
    receiver_id: str,
    content: str = Body(..., embed=True),
    sender_id: str = Depends(verify_jwt_token)
):
    chat_id = await get_or_create_direct_chat_controller(
        sender_id=sender_id,
        other_user_id=receiver_id
    )

    message = await send_chat_messages(
        sender_id=sender_id,
        chat_id=chat_id,
        content=content
    )

    await ws_manager.broadcast(chat_id, {
        "type": "new_message",
        "data": message
    })

    return {
        "chat_id": chat_id,
        "message": message
    }


@router.get("/direct/get/{chat_id}")
async def get_messages_endpoint(
    chat_id: str,
    sender_id: str = Depends(verify_jwt_token)
):
    """
    Get messages of a direct chat
    """

    try:

        messages = await get_chat_messages(
            sender_id=sender_id,
            chat_id=chat_id
        )

        return messages
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching messages: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
