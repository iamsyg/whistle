# app/routers/chat.py

from fastapi import APIRouter, Depends, Body
from app.controllers.chat_controller import send_direct_message, get_direct_messages, get_or_create_direct_chat_controller
from app.middlewares.secure_route import verify_jwt_token

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/direct/send/{receiver_id}")
async def send_message_endpoint(
    receiver_id: str,
    content: str = Body(..., embed=True),
    sender_id: str = Depends(verify_jwt_token)
):
    """
    Send message to a user (direct chat)
    """

    message = await send_direct_message(
        sender_id=sender_id,
        receiver_id=receiver_id,
        content=content
    )

    return message


@router.get("/direct/get/{chat_id}")
async def get_messages_endpoint(
    chat_id: str,
    sender_id: str = Depends(verify_jwt_token)
):
    """
    Get messages of a direct chat
    """

    messages = await get_direct_messages(
        sender_id=sender_id,
        chat_id=chat_id
    )

    return messages




@router.post("/direct/init/{other_user_id}")
async def init_direct_chat(
    other_user_id: str,
    sender_id: str = Depends(verify_jwt_token)
):
    chat = await get_or_create_direct_chat_controller(
        sender_id=sender_id,
        other_user_id=other_user_id
    )

    return {"chat_id": chat["id"]}
