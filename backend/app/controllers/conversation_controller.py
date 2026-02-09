# app/controllers/conversation_controller.py

from fastapi import HTTPException
from app.utils.supabase_client import supabase
from typing import List


# Return/Create chat ID

async def get_or_create_direct_chat_controller(
    sender_id: str,
    other_user_id: str
):
    chat_res = supabase.rpc(
        "get_or_create_direct_chat",
        {
            "u1": sender_id,
            "u2": other_user_id,
            "creator": sender_id
        }
    ).execute()

    if not chat_res.data:
        raise HTTPException(status_code=500, detail="Failed to get or create chat")

    # return chat_res.data

    chat = chat_res.data[0] if isinstance(chat_res.data, list) else chat_res.data
    return chat["id"]


# Return all chats for a user

async def get_user_all_chats_controller(user_id: str):

    # 1️⃣ Fetch chats user belongs to
    chats_res = (
        supabase
        .table("chat_members")
        .select("chat_id, chat(id, type, user1, user2, title, image_url, last_message_at)")
        .eq("user_id", user_id)
        .is_("left_at", None)
        .neq("chat.type", "classroom")
        .execute()
    )

    chat_ids = [row["chat_id"] for row in chats_res.data]

    if not chat_ids:
        return []

    # 2️⃣ Fetch other members for direct chats
    members_res = (
        supabase
        .table("chat_members")
        .select("chat_id, user_id")
        .in_("chat_id", chat_ids)
        .is_("left_at", None)
        .neq("user_id", user_id)
        .execute()
    )

    chat_to_other_user = {row["chat_id"]: row["user_id"] for row in members_res.data}
    other_user_ids = list(set(chat_to_other_user.values()))

    # 3️⃣ Batch fetch profiles
    profiles_res = (
        supabase
        .table("profile")
        .select("id, name, username, avatar_url")
        .in_("id", other_user_ids)
        .execute()
    )

    profile_map = {p["id"]: p for p in profiles_res.data}

    # 4️⃣ Fetch last messages via RPC
    last_messages_res = supabase.rpc(
        "get_last_messages_per_chat",
        {"p_chat_ids": chat_ids}
    ).execute()

    last_message_map = {msg["chat_id"]: msg for msg in last_messages_res.data}

    # 5️⃣ Build chat_cards exactly like original
    chat_cards = []

    for row in chats_res.data:
        chat = row["chat"]
        chat_id = row["chat_id"]

        if not chat:
            continue

        other_user = None
        if chat["type"] == "direct":
            other_user_id = chat_to_other_user.get(chat_id)
            other_user = profile_map.get(other_user_id)

        last_message = last_message_map.get(chat_id)

        chat_cards.append({
            "chat_id": chat_id,
            "type": chat["type"],
            "other_user": other_user if chat["type"] == "direct" else None,

            "title": chat["title"] if chat["type"] != "direct" else None,
            "avatar_url": chat["image_url"] if chat["type"] != "direct" else None,

            # ⬇️ SAME SHAPE AS PREVIOUS
            "last_message": {
                "content": last_message["content"],
                "created_at": last_message["created_at"],
                "sender_id": last_message["sender_id"],
            } if last_message else None,

            "last_message_at": last_message["created_at"] if last_message else chat.get("last_message_at"),
        })


    return chat_cards



# Create group chat controller (placeholder)


async def create_group_chat_controller(
    creator_id: str,
    title: str,
    member_ids: List[str],
):
    try:

        title = title.strip()
        if not title:
            raise HTTPException(status_code=400, detail="Group title cannot be empty")

        # Remove duplicates + creator
        unique_members = set(member_ids)
        unique_members.discard(creator_id)

        if len(unique_members) < 2:
            raise HTTPException(
                status_code=400,
                detail="Group chat must have at least 2 other members"
            )

        chat_res = supabase.table("chat").insert({
            "type": "group",
            "title": title,
            "created_by": creator_id,
        }).execute()

        if not chat_res.data:
            raise HTTPException(status_code=500, detail="Failed to create group chat")

        chat = chat_res.data[0]
        chat_id = chat["id"]

        member_rows = [
            {
                "chat_id": chat_id,
                "user_id": uid,
                "role": "member"
            }
            for uid in unique_members
        ]

        # Add creator as admin
        member_rows.append({
            "chat_id": chat_id,
            "user_id": creator_id,
            "role": "admin"
        })

        supabase.table("chat_members").insert(member_rows).execute()

        return chat_id

    except HTTPException:
        raise
    except Exception as e:
        print("❌ Error creating group chat:", str(e))
        raise HTTPException(status_code=500, detail="Failed to create group chat")
