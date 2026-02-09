# backend/app/routes/conversation.py

import traceback
from fastapi import APIRouter, Depends, Body, HTTPException
from app.controllers.conversation_controller import get_or_create_direct_chat_controller, get_user_all_chats_controller, create_group_chat_controller

from app.controllers.classroom.fetch_classrooms.fetch_email_classrooms import fetch_email_classrooms_controller

from app.controllers.classroom.fetch_classrooms.fetch_non_email_classrooms import fetch_non_email_classrooms_controller

from app.middlewares.secure_route import verify_jwt_token
from typing import List, Literal, Optional

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



# Note: This endpoint is currently only used for fetching chats. Classroom conversations are fetched via the /classroom/all endpoint which combines both email and non-email classrooms.

@router.get("/all")
async def get_all_conversations(
    user_id: str = Depends(verify_jwt_token),
    selected_email: Optional[str] = None,
    conversation_type: Literal["chat", "classroom", "all"] = "all"
):
    try:
        chats = []
        email_classrooms = []
        non_email_classrooms = []

        # 1️⃣ Fetch chats
        if conversation_type in ("chat", "all"):
            chats = await get_user_all_chats_controller(user_id)

        # 2️⃣ Fetch classrooms
        if conversation_type in ("classroom", "all"):
            if selected_email:
                email_classrooms = await fetch_email_classrooms_controller(
                    user_id=user_id,
                    selected_email=selected_email
                )
            else:
                non_email_classrooms = await fetch_non_email_classrooms_controller(
                    user_id=user_id
                )

        # 3️⃣ Normalize classrooms → conversation cards
        classroom_conversations = [
            {
                "chat_id": c["chat_id"],
                "type": "classroom",
                "title": c["title"],
                "avatar_url": None,
                "last_message": None,
                "last_message_at": None,
                "meta": c  # 👈 unchanged classroom payload
            }
            for c in (email_classrooms + non_email_classrooms)
        ]

        return chats + classroom_conversations

    except HTTPException:
        raise
    except Exception as e:
        print("❌ Error fetching conversations:", str(e))
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Failed to fetch conversations")


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
            "chat_id": chat_id,
            "type": "group"
        }
    
    except HTTPException as e:
        print(f"❌ HTTP Error creating group chat by user {creator_id}: {str(e)}")
        raise