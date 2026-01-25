# backend/app/controllers/classroom_controller.py

from fastapi import HTTPException
from app.utils.supabase_client import supabase
from typing import List, Optional
import secrets
import string

ALPHABET = string.ascii_uppercase + string.digits

def generate_class_code(length=7):
    return "".join(secrets.choice(ALPHABET) for _ in range(length))

def generate_invite_link():
    return secrets.token_urlsafe(16)




# Controller to create a new classroom

async def create_classroom_controller(
    title: str,
    creator_id: str,
    creator_email: str,
    description: str | None,
    require_email: bool,
    allow_student_chat: bool,
):
    # 1️⃣ Resolve email → UUID + google_name
    email_res = (
        supabase
        .table("emails")
        .select("id, google_name")
        .eq("email", creator_email)
        .eq("user_id", creator_id)
        .eq("verified", True)
        .limit(1)
        .execute()
    )

    if not email_res.data:
        raise HTTPException(400, "Invalid or unverified email")

    email_row = email_res.data[0]
    email_id = email_row["id"]
    google_name = email_row["google_name"]

    # 2️⃣ Create classroom chat
    chat_res = (
        supabase
        .table("chat")
        .insert({
            "type": "classroom",
            "title": title.strip(),
            "description": description,
            "created_by": creator_id,
        })
        .execute()
    )

    if not chat_res.data:
        raise HTTPException(500, "Failed to create chat")

    chat = chat_res.data[0]

    # 3️⃣ Create classroom metadata
    supabase.table("classrooms").insert({
        "chat_id": chat["id"],
        "email_id": email_id,
        "class_code": generate_class_code(),
        "invite_link": generate_invite_link(),
        "require_email": require_email,
        "allow_student_chat": allow_student_chat,
    }).execute()

    # 4️⃣ Add creator as admin
    supabase.table("chat_members").insert({
        "chat_id": chat["id"],
        "user_id": creator_id,
        "role": "admin",
    }).execute()

    # 5️⃣ Return full ClassroomProfile-compatible object
    return {
        "chat_id": chat["id"],
        "title": chat["title"],
        "description": chat.get("description"),
        "created_at": chat["created_at"],
        "creator": {
            "id": creator_id,
            "name": google_name or "Unknown",
            "avatar_url": None,
            "email": creator_email,
            "google_name": google_name,
        },
        "allowed_domains": None,
        "allow_student_chat": allow_student_chat,
        "require_email": require_email,
        "is_admin": True,
    }




    

# Fetch all classrooms for a user
async def get_user_all_classrooms_controller(user_id: str, selected_email: str):
    
    # 1️⃣ Resolve selected email → email_id
    email_res = (
        supabase
        .table("emails")
        .select("id, google_name")
        .eq("user_id", user_id)
        .eq("email", selected_email)
        .eq("verified", True)
        .limit(1)
        .execute()
    )

    if not email_res.data:
        return []

    email_row = email_res.data[0]
    email_id = email_row["id"]
    google_name = email_row["google_name"]

    # 2️⃣ Fetch classrooms
    res = (
        supabase
        .from_("classrooms")
        .select("""
            chat:chat_id!inner (
                id,
                title,
                description,
                created_at,
                created_by,
                chat_members!inner (
                    user_id,
                    left_at
                )
            )
        """)
        .eq("email_id", email_id)
        .eq("chat.chat_members.user_id", user_id)
        .is_("chat.chat_members.left_at", None)
        .execute()
    )

    classrooms = []

    for row in res.data or []:
        chat = row["chat"]
        classrooms.append({
            "chat_id": chat["id"],
            "title": chat["title"],
            "description": chat.get("description"),
            "created_at": chat["created_at"],
            "creator": {
                "id": user_id,
                "name": google_name or "Unknown",
                "avatar_url": None,
                "email": selected_email,
                "google_name": google_name,
            },
            "allowed_domains": None,
            "allow_student_chat": True,  # default or fetch if stored
            "require_email": True,       # default or fetch if stored
            "is_admin": True,            # assume true for creator
        })

    return classrooms
