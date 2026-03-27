# backend/app/controllers/chat/fetch_members/fetch_members.py

from fastapi import HTTPException
from app.utils.supabase_client import supabase


async def fetch_chat_members_controller(chat_id: str, user_id: str, include_phone: bool = False):

    try:
        # Combined membership + chat type check
        membership_check = (
            supabase.table("chat_members")
            .select("""
                user_id,
                chat:chat_id (
                    id,
                    type
                )
            """)
            .eq("chat_id", chat_id)
            .eq("user_id", user_id)
            .is_("left_at", None)
            .limit(1)
            .execute()
        )

        if not membership_check.data:
            raise HTTPException(status_code=403, detail="Access denied")

        chat_type = membership_check.data[0]["chat"]["type"]

        if chat_type == "classroom":
            raise HTTPException(
                status_code=403,
                detail="Members cannot be fetched for classroom chats",
            )

        # Fetch members
        # res = (
        #     supabase.table("chat_members")
        #     .select("""
        #         user_id,
        #         role,
        #         profile:user_id (
        #             id,
        #             name,
        #             username,
        #             avatar_url
        #             {", phone_number" if include_phone else ""}
        #         )
        #     """)
        #     .eq("chat_id", chat_id)
        #     .is_("left_at", None)
        #     .order("role")
        #     .execute()
        # )

        res = (
            supabase.table("chat_members")
            .select(f"""
                user_id,
                role,
                profile:user_id (
                    id,
                    name,
                    username,
                    avatar_url
                    {", phone_number" if include_phone else ""}
                )
            """)
            .eq("chat_id", chat_id)
            .is_("left_at", None)
            .order("role")
            .execute()
        )

        # return [
        #     {
        #         "user_id": row["user_id"],
        #         "role": row["role"],
        #         "name": row["profile"]["name"],
        #         "username": row["profile"]["username"],
        #         "avatar_url": row["profile"]["avatar_url"],
        #     }
        #     for row in res.data or []
        # ]

        return [
            {
                "user_id": row["user_id"],
                "role": row["role"],
                "name": row["profile"]["name"],
                "username": row["profile"]["username"],
                "avatar_url": row["profile"]["avatar_url"],
                **(
                    {"phone_number": row["profile"].get("phone_number")}
                    if include_phone else {}
                )
            }
            for row in res.data or []
        ]

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching chat members: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch chat members")
