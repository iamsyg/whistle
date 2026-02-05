# backend/app/controllers/classroom/fetch_members/fetch_non_email_classroom_members.py

from fastapi import HTTPException
from app.utils.supabase_client import supabase


def fetch_non_email_classroom_members_controller(classroom_chat_id: str):
    classroom = (
        supabase
        .from_("classrooms")
        .select("chat_id")
        .eq("chat_id", classroom_chat_id)
        .eq("require_email", False)
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
            join_via,
            profile:profile (
                phone_number,
                username,
                name,
                avatar_url
            )
        """)
        .eq("chat_id", classroom_chat_id)
        .is_("left_at", None)
        .execute()
    )

    result = []

    for row in members.data:
        join_via = row["join_via"]        

        profile = row.get("profile") or {}

        result.append({
            "user_id": row["user_id"],
            "role": row["role"],

            "name": profile.get("name"),
            "avatar_url": profile.get("avatar_url"),

            # conditional exposure
            "phone_number": (
                profile.get("phone_number")
                if join_via == "phone"
                else None
            ),

            "username": (
                profile.get("username")
                if join_via == "username"
                else None
            ),

            "joined_at": row["joined_at"],
        })

    return result
