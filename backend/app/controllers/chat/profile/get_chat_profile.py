# backend/app/controllers/chat/profile/get_chat_profile.py

from fastapi import HTTPException
from app.utils.supabase_client import supabase
from app.controllers.chat.fetch_members.fetch_members import fetch_chat_members_controller


async def get_chat_profile_controller(current_user_id: str, chat_id: str):
    try:
        # 1. Validate membership + get chat
        chat_res = (
            supabase.table("chat_members")
            .select("""
                chat:chat_id (
                    id,
                    type,
                    title,
                    description,
                    image_url,
                    user1,
                    user2
                )
            """)
            .eq("chat_id", chat_id)
            .eq("user_id", current_user_id)
            .is_("left_at", None)
            .single()
            .execute()
        )

        if not chat_res.data:
            raise HTTPException(status_code=403, detail="Access denied")

        chat = chat_res.data["chat"]
        chat_type = chat["type"]

        # GROUP CHAT 
        if chat_type == "group":
            members = await fetch_chat_members_controller(chat_id, current_user_id, include_phone=True)

            enriched_members = [
                {
                    "user_id": m["user_id"],
                    "name": m["name"],
                    "username": m["username"],
                    "avatar_url": m["avatar_url"],
                    "phone_number": m.get("phone_number"),
                    "role": m["role"],
                }
                for m in members
            ]

            return {
                "id": chat["id"],
                "name": chat["title"],
                "username": None,
                "avatar_url": chat["image_url"],
                "phone_number": None,
                "about": chat["description"],
                "profile_links": [],
                "members": enriched_members,
            }

        # DIRECT CHAT
        elif chat_type == "direct":
            other_user_id = (
                chat["user1"]
                if chat["user2"] == current_user_id
                else chat["user2"]
            )

            profile_res = (
                supabase.table("profile")
                .select("""
                    id,
                    name,
                    username,
                    avatar_url,
                    phone_number,
                    about,
                    profile_links
                """)
                .eq("id", other_user_id)
                .single()
                .execute()
            )

            if not profile_res.data:
                raise HTTPException(status_code=404, detail="User not found")

            profile = profile_res.data

            # WhatsApp-style display name
            display_name = (
                profile.get("name")
                or profile.get("username")
                or profile.get("phone_number")
            )

            return {
                "id": profile["id"],
                "name": display_name,
                "username": profile["username"],
                "avatar_url": profile["avatar_url"],
                "phone_number": profile["phone_number"],
                "about": profile["about"],
                "profile_links": profile.get("profile_links") or [],
            }

        # CLASSROOM CHAT (blocked)
        else:
            raise HTTPException(
                status_code=403,
                detail="Profile not available for classroom chats",
            )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching chat profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch chat profile")