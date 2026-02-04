# backend/app/controllers/classroom/fetch_non_email_classrooms.py

from fastapi import HTTPException
from app.utils.supabase_client import supabase


# Fetch non email classrooms for a user
async def fetch_non_email_classrooms_controller(user_id: str):

    try:
        res = (
            supabase
            .from_("classrooms")
            .select("""
                require_email,
                allow_student_chat,
                allowed_domains,
                invite_link,
                class_code,
                chat:chat_id!inner (
                    id,
                    title,
                    description,
                    created_at,
                    created_by,
                    creator:created_by (
                        id,
                        name,
                        avatar_url
                    ),
                    chat_members!inner (
                        user_id,
                        role,
                        left_at
                    )
                )
            """)
            .eq("require_email", False)
            .eq("chat.chat_members.user_id", user_id)
            .is_("chat.chat_members.left_at", None)
            .execute()
        )

        classrooms = []

        for row in res.data or []:
            chat = row["chat"]

            # find current user's member row
            member = next(
                (m for m in chat["chat_members"] if m["user_id"] == user_id),
                None
            )

            classrooms.append({
                "chat_id": chat["id"],
                "title": chat["title"],
                "description": chat.get("description"),
                "created_at": chat["created_at"],

                "creator": {
                    "id": chat["creator"]["id"],
                    "name": chat["creator"]["name"] or "Unknown",
                    "avatar_url": None,
                    "email": None,
                    "google_name": None,
                },

                "invite_link": row.get("invite_link"),
                "class_code": row.get("class_code"),

                "allowed_domains": row.get("allowed_domains") or [],
                "allow_student_chat": row.get("allow_student_chat", True),
                "require_email": row.get("require_email", False),
                "join_method": "email" if row.get("require_email", False) else "non-email",
                "is_admin": member["role"] == "admin" if member else False,
            })


        return classrooms
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
