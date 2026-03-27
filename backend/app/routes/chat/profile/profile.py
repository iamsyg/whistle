# backend/app/routes/chat/profile/profile.py

from fastapi import APIRouter, Depends, HTTPException
from app.middlewares.secure_route import verify_jwt_token
from app.controllers.chat.profile.get_chat_profile import get_chat_profile_controller

router = APIRouter(prefix="/profile", tags=["Chat Profile"])

@router.get("/{chat_id}")
async def get_chat_profile(
    chat_id: str, 
    current_user_id: str = Depends(verify_jwt_token)
    ):

    try:
        return await get_chat_profile_controller(current_user_id, chat_id)
    
    except Exception as e:
        print(f"Error fetching chat profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
