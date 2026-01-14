# app/controllers/conversation_controller.py

from fastapi import HTTPException
from app.utils.supabase_client import supabase


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
    try:
        # 1️⃣ Fetch chats user is part of
        chats_res = (
            supabase
            .table("chat_members")
            .select("""
                chat_id,
                chat:chat (
                    id,
                    type,
                    user1,
                    user2,
                    last_message_at
                )
            """)
            .eq("user_id", user_id)
            .is_("left_at", None)
            .execute()
        )

        if not chats_res.data:
            return []

        chat_cards = []

        for row in chats_res.data:
            chat = row["chat"]
            chat_id = chat["id"]

            # 2️⃣ Resolve other user (for direct chats)
            other_user_id = None
            if chat["type"] == "direct":
                other_user_id = (
                    chat["user2"]
                    if chat["user1"] == user_id
                    else chat["user1"]
                )

            other_user = None
            if other_user_id:
                user_res = (
                    supabase
                    .table("profile")
                    .select("id, phone_number_hash, phone_number, name, username, avatar_url")
                    .eq("id", other_user_id)
                    .single()
                    .execute()
                )
                other_user = user_res.data

            # 3️⃣ Fetch last message
            msg_res = (
                supabase
                .table("messages")
                .select("content, created_at, sender_id")
                .eq("chat_id", chat_id)
                .is_("deleted_at", None)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )

            last_message = msg_res.data[0] if msg_res.data else None

            chat_cards.append({
                "chat_id": chat_id,
                "type": chat["type"],
                "other_user": other_user,
                "last_message": last_message,
                "last_message_at": chat["last_message_at"],
            })

        return chat_cards

    except Exception as e:
        print("❌ Error fetching chats:", str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch chats")
