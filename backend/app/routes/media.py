# backend/app/routes/media.py

import traceback
from fastapi import APIRouter, Depends, Body, File, Form, HTTPException, UploadFile
from app.middlewares.secure_route import verify_jwt_token

from app.controllers.media.upload_media import upload_media_controller

from typing import List

router = APIRouter(
    prefix="/media",
    tags=["Media"]
)

@router.post("/upload")
async def upload_media(
    user_id: str = Depends(verify_jwt_token),
    conversation_type: str = Form(...),
    chat_id: str = Form(...),
    file: UploadFile = File(...)
):
    
    try:
        # Placeholder for media upload logic
        response = upload_media_controller(
            sender_id=user_id,
            conversation_type=conversation_type,
            chat_id=chat_id,
            file=file
        )

        print(f"✅ User {user_id} is uploading media: {response}")
        
        return response
    
    except HTTPException:
        raise

    except Exception:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Failed to upload media"
        )