# backend/app/controllers/classroom/fetch_classrooms/fetch_email_classrooms.py

from fastapi import HTTPException
from app.utils.supabase_client import supabase

async def fetch_email_classrooms_controller(user_id: str, selected_email: str):

    try:
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

        # 2️⃣ Fetch classrooms
        res = (
            supabase
            .from_("classrooms")
            .select("""
                require_email,
                allow_student_chat,
                allowed_domains,
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
                        left_at,
                        email_id
                    )
                )
            """)
            .eq("require_email", True)
            .eq("chat.chat_members.user_id", user_id)
            .eq("chat.chat_members.email_id", email_id)  # 🔥 SELECTED EMAIL
            .is_("chat.chat_members.left_at", None)
            .execute()
        )


        classrooms = []

        for row in res.data or []:
            chat = row["chat"]

            # find current user's member row
            member = next(
                (
                    m for m in chat.get("chat_members", [])
                    if m["user_id"] == user_id and m["left_at"] is None
                ),
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
                    "avatar_url": chat["creator"].get("avatar_url"),
                    "email": selected_email,
                    "google_name": email_row.get("google_name"),
                },

                "allowed_domains": row.get("allowed_domains"),
                "allow_student_chat": row.get("allow_student_chat", True),
                "require_email": True,
                "is_admin": member["role"] == "admin" if member else False,
            })

        return classrooms

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
