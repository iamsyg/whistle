# backend/app/routes/emails_route.py

import traceback
from fastapi import APIRouter, Depends, Body, HTTPException
from app.controllers.email_controller import get_user_emails_controller
from app.middlewares.secure_route import verify_jwt_token
from typing import List

router = APIRouter(
    prefix="/user",
    tags=["User"]
)

# Get user emails

@router.get("/emails")
async def get_user_emails(
    user_id: str = Depends(verify_jwt_token)
):
    try:
        emails = get_user_emails_controller(user_id=user_id)
        print(f"✅ Fetched emails for user {user_id}: {emails}")
        return {"emails": emails}
    
    except HTTPException:
        raise

    except Exception:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch user emails"
        )