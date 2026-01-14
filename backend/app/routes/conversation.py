# backend/app/routes/conversation.py

import traceback
from fastapi import APIRouter, Depends, Body, HTTPException
from app.controllers.conversation_controller import get_or_create_direct_chat_controller, get_user_all_chats_controller, create_group_chat_controller
from app.middlewares.secure_route import verify_jwt_token
from typing import List

router = APIRouter(
    prefix="/conversation",
    tags=["Conversation"]
)

# Get chat ID

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
    

@router.get("/all/user")
async def get_user_all_chats(
    user_id: str = Depends(verify_jwt_token)
):
    
    try:
        conversation_ids = await get_user_all_chats_controller(user_id=user_id)
        print(f"✅ Fetched conversation IDs for user {user_id}: {conversation_ids}")
        return {"conversation_ids": conversation_ids}
    
    except HTTPException as e:
        print(f"❌ HTTP Error fetching conversation IDs for user {user_id}: {str(e)}")
        raise



@router.post("/create-group")
async def create_group_chat(
    creator_id: str = Depends(verify_jwt_token),
    title: str = Body(..., embed=True),
    member_ids: List[str] = Body(..., embed=True),
):
    try:
        chat_id = await create_group_chat_controller(
            creator_id=creator_id,
            title=title,
            member_ids=member_ids
        )
        print(f"✅ Created group chat {chat_id} by user {creator_id}")
        return {
            "success": True,
            "chat_id": chat_id
        }
    
    except HTTPException as e:
        print(f"❌ HTTP Error creating group chat by user {creator_id}: {str(e)}")
        raise