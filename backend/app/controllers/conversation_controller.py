# app/controllers/conversation_controller.py

from fastapi import HTTPException
from app.utils.supabase_client import supabase

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


async def get_user_all_chat_ids_controller(user_id: str):

    try:
        res = (
            supabase
            .table("chat_members")
            .select("chat_id")
            .eq("user_id", user_id)
            .is_("left_at", None)
            .execute()
        )

        print("Fetched chat IDs response:", res)

        if res.data is None:
            raise HTTPException(
                status_code=500,
                detail="Failed to fetch chat IDs"
            )

        # Extract chat IDs cleanly
        chat_ids = [row["chat_id"] for row in res.data]

        print("✅ Chat IDs fetched:", chat_ids)

        return chat_ids

    except Exception as e:
        print("❌ Error fetching chat IDs:", str(e))
        raise HTTPException(status_code=500, detail=str(e))