# app/routers/chat.py

import traceback
from fastapi import APIRouter, Depends, Body, HTTPException
from app.controllers.chat_controller import send_message_to_chat, get_direct_messages, get_or_create_direct_chat_controller
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

        message = await send_message_to_chat(
            sender_id=sender_id,
            chat_id=chat_id,
            content=content
        )

        print(f"✅ Message saved to database: {message['id']}")

        await ws_manager.broadcast(chat_id, {
            "type": "new_message",
            "data": message
        }, exclude_user=sender_id)

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

    message = await send_message_to_chat(
        sender_id=sender_id,
        chat_id=chat_id,
        content=content
    )

    await ws_manager.broadcast(chat_id, {
        "type": "new_message",
        "data": message
    }, exclude_user=sender_id)

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

        messages = await get_direct_messages(
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
    

@router.post("/direct/init/{other_user_id}")
async def init_direct_chat(
    other_user_id: str,
    sender_id: str = Depends(verify_jwt_token)
):
    
    try:

        chat_id = await get_or_create_direct_chat_controller(
            sender_id=sender_id,
            other_user_id=other_user_id
        )

        print(f"Direct chat initialized between {sender_id} and {other_user_id}: {chat_id}")

        # return {"chat_id": chat["id"]}
        return {"chat_id": chat_id}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error initializing chat: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

