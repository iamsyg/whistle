# backend/app/routes/conversation.py

import traceback
from fastapi import APIRouter, Depends, Body, HTTPException
from app.controllers.conversation_controller import get_or_create_direct_chat_controller
from app.middlewares.secure_route import verify_jwt_token

router = APIRouter(
    prefix="/conversation",
    tags=["Conversation"]
)

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