# backend/app/controllers/email_controller.py

from fastapi import HTTPException
from app.utils.supabase_client import supabase
from typing import List

# Get user emails

def get_user_emails_controller(user_id: str) -> List[str]:
    emails_res = (
        supabase
        .table("emails")
        .select("email")
        .eq("user_id", user_id)
        .execute()
    )

    if emails_res is None:
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch user emails"
        )

    return [item["email"] for item in emails_res.data] if emails_res.data else []
