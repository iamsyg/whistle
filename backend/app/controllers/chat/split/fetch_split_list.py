# backend/app/controllers/chat/split/fetch_split_list.py

from fastapi import HTTPException
from app.utils.supabase_client import supabase


async def fetch_split_list_controller(chat_id: str, current_user_id: str):
    try:
        # ✅ Membership + chat type check
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
            .eq("user_id", current_user_id)
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
                detail="Splits cannot exist in classroom chats",
            )

        # ✅ Fetch ALL splits of this chat
        res = (
            supabase.table("splits")
            .select("""
                id,
                title,
                status,
                total_amount,
                created_at,
                updated_at,
                settled_at,
                    
                paid_by_user_info:paid_by (
                    id,
                    name
                ),
                    
                split_members (
                    amount_owed,
                    status,
                    user_id
                )
            
            """)
            .eq("chat_id", chat_id)
            .order("created_at", desc=True)
            .order("id", desc=True)
            .execute()
        )

        if not res.data:
            return []

        splits = []

        for split in res.data:

            members = split.get("split_members", [])
            paid_by = split.get("paid_by_user_info")

            payer_id = paid_by["id"] if paid_by else None

            current_user_member = next(
                (m for m in members if m["user_id"] == current_user_id),
                None
            )

            is_settled = split["status"].lower() == "settled"

            can_pay = (
                not is_settled
                and current_user_member is not None
                and current_user_member["status"] == "pending"
                and float(current_user_member["amount_owed"]) > 0
                and current_user_member["user_id"] != payer_id
            )

            splits.append({
                "id": split["id"],
                "title": split["title"],
                "status": split["status"],
                "total_amount": float(split["total_amount"] or 0),
                "paid_by_user_info": paid_by,
                "split_members": members,
                "split_members_count": len(members),
                "can_pay": can_pay,
                "created_at": split["created_at"],
                "updated_at": split["updated_at"],
                "settled_at": split["settled_at"],
            })

        return splits 

    except HTTPException:
        raise  # ← was missing, HTTPException was being swallowed

    except Exception as e:
        print("Error fetching split list:", str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch split list")