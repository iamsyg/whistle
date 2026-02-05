# backend/app/controllers/classroom/fetch_members/fetch_email_classroom_members.py

from fastapi import HTTPException
from app.utils.supabase_client import supabase


def fetch_email_classroom_members_controller(classroom_chat_id: str):
    classroom = (
        supabase
        .from_("classrooms")
        .select("chat_id")
        .eq("chat_id", classroom_chat_id)
        .eq("require_email", True)
        .single()
        .execute()
    )

    if not classroom.data:
        # Classroom either doesn't exist or doesn't require email
        return []
    
    members = (
        supabase
        .from_("chat_members")
        .select("""
            user_id,
            role,
            joined_at,
            emails:email_id (
                email,
                google_name,
                google_avatar
            )
        """)
        .eq("chat_id", classroom_chat_id)
        .is_("left_at", None)
        .not_.is_("email_id", None)
        .execute()
    )


    return [
        {
            "user_id": row["user_id"],
            "role": row["role"],
            "joined_at": row["joined_at"],
            "email": row["emails"]["email"],
            "google_name": row["emails"]["google_name"],
            "google_avatar": row["emails"]["google_avatar"],
        }
        for row in members.data
    ]
