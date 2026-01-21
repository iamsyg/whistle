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

from typing import Optional
from fastapi import HTTPException

async def create_classroom_controller(
    title: str,
    creator_id: str,
    description: Optional[str] = None,
    required_email: bool = True,
    allowed_student_chat: bool = True,
):
    # 1️⃣ Validate title

    try:
        title = title.strip()
        if not title:
            raise HTTPException(status_code=400, detail="Classroom title cannot be empty")

        description = description.strip() if description and description.strip() else None

        # 2️⃣ Generate metadata
        class_code = generate_class_code()
        invite_link = generate_invite_link()

        # 3️⃣ Create classroom chat
        chat_res = supabase.table("chat").insert({
            "type": "classroom",
            "title": title,
            "description": description,
            "created_by": creator_id,
        }).execute()

        if not chat_res.data:
            raise HTTPException(status_code=500, detail="Failed to create classroom chat")

        chat = chat_res.data[0]

        # 4️⃣ Create classroom metadata
        classroom_res = supabase.table("classrooms").insert({
            "chat_id": chat["id"],
            "class_code": class_code,
            "invite_link": invite_link,
            "require_email": required_email,
            "allow_student_chat": allowed_student_chat,
        }).execute()

        if not classroom_res.data:
            raise HTTPException(status_code=500, detail="Failed to create classroom metadata")

        # 5️⃣ Add creator as ADMIN
        supabase.table("chat_members").insert({
            "chat_id": chat["id"],
            "user_id": creator_id,
            "role": "admin",
        }).execute()

        return {
            "chat_id": chat["id"],
            "class_code": class_code,
            "invite_link": invite_link,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

# Fetch all classrooms for a user
async def get_user_all_classrooms_controller(user_id: str):
    try:
        classrooms = []

        res = (
            supabase
            .from_("chat_members")
            .select("""
                chat:chat_id (
                    id,
                    title,
                    description,
                    created_by,
                    created_at
                )
            """)
            .eq("user_id", user_id)
            .is_("left_at", None)
            .eq("chat.type", "classroom")
            .execute()
        )

        for row in res.data or []:
            chat = row.get("chat")
            if not chat:
                continue

            classrooms.append({
                "chat_id": chat["id"],
                "title": chat["title"],
                "description": chat.get("description"),
                "created_by": chat["created_by"],
                "created_at": chat["created_at"],
            })

        return classrooms

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
