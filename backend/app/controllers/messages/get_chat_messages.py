# app/controllers/messages/get_chat_messages.py

from fastapi import HTTPException
from app.utils.supabase_client import supabase

def resolve_sender(msg, classroom_meta, member):
    sender = msg.get("sender")
    # member = (msg.get("member") or [None])[0]

    # fallback
    if not sender:
        return None

    # ---------------- NON-CLASSROOM ----------------
    if not classroom_meta or not classroom_meta.get("is_classroom"):
        return {
            "id": sender["id"],
            "name": sender.get("name"),
            "phone_number": sender.get("phone_number"),
            "username": sender.get("username"),
            "avatar_url": sender.get("avatar_url"),
        }

    # ---------------- CLASSROOM ----------------
    if not member:
        return {"id": sender["id"]}

    require_email = classroom_meta["require_email"]

    # ---- require_email = true ----
    if require_email:
        email = member.get("emails")
        if not email:
            return {"id": sender["id"]}

        return {
            "id": sender["id"],
            "google_name": email.get("google_name"),
            "google_avatar": email.get("google_avatar"),
            "email": email.get("email"),
            "role": member.get("role")
        }

    # ---- require_email = false ----
    base = {
        "id": sender["id"],
        "name": sender.get("name"),
        "avatar_url": sender.get("avatar_url"),
        "role": member.get("role")
    }

    if member.get("join_via") == "phone":
        base["phone_number"] = sender.get("phone_number")

    elif member.get("join_via") == "username":
        base["username"] = sender.get("username")

    return base




async def get_chat_messages(sender_id: str, chat_id: str):
    try:
        # ✅ membership check
        member_res = (
            supabase
            .table("chat_members")
            .select("user_id")
            .eq("chat_id", chat_id)
            .eq("user_id", sender_id)
            .is_("left_at", None)
            .execute()
        )

        if not member_res.data:
            raise HTTPException(403, "Not a member of this chat")

        # ---------- detect classroom ----------
        classroom_res = (
            supabase
            .table("classrooms")
            .select("require_email")
            .eq("chat_id", chat_id)
            .maybe_single()
            .execute()
        )

        classroom_data = classroom_res.data if classroom_res else None

        classroom_meta = {
            "is_classroom": bool(classroom_data),
            "require_email": classroom_data.get("require_email", False)
            if classroom_data
            else False
        }


        # ---------- fetch messages ----------
        msg_res = (
            supabase
            .table("messages")
            .select("""
                id,
                chat_id,
                sender_id,
                content,
                message_type,
                metadata,
                reply_to_id,
                created_at,
                edited_at,
                deleted_at,
                sender:profile!messages_sender_id_fkey (
                    id,
                    name,
                    phone_number,
                    username,
                    avatar_url
                )
            """)
            .eq("chat_id", chat_id)
            .is_("deleted_at", None)
            .order("created_at", desc=False)
            .execute()
        )

        members_res = (
            supabase
            .table("chat_members")
            .select("""
                user_id,
                join_via,
                role,
                emails:email_id (
                    email,
                    google_name,
                    google_avatar
                )
            """)
            .eq("chat_id", chat_id)
            .is_("left_at", None)
            .execute()
        )

        member_map = {
            m["user_id"]: m
            for m in (members_res.data or [])
        }




        # ---------- normalize output ----------
        messages = []
        for msg in (msg_res.data or []):

            sender_member = member_map.get(msg["sender_id"])

            messages.append({
                "id": msg["id"],
                "chat_id": msg["chat_id"],
                "sender_id": msg["sender_id"],
                "content": msg["content"],
                "message_type": msg.get("message_type"),
                "metadata": msg.get("metadata"),
                "reply_to_id": msg["reply_to_id"],
                "created_at": msg["created_at"],
                "edited_at": msg["edited_at"],
                "deleted_at": msg["deleted_at"],
                "sender": resolve_sender(msg, classroom_meta, sender_member),
            })

        return messages

    except HTTPException:
        raise
    except Exception as e:
        print("❌ get_direct_messages error:", e)
        raise HTTPException(500, "Failed to fetch messages")
