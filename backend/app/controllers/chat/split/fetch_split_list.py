# backend/app/controllers/chat/split/fetch_split_list.py

from fastapi import HTTPException
from app.utils.supabase_client import supabase


async def fetch_split_list_controller(chat_id: str, current_user_id: str):
    try:
        # Membership + chat type check
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

        # Fetch ALL splits of this chat
        # NOTE: added user:user_id(name) to split_members so the frontend
        # can display each member's name in the breakdown without a second fetch.
        res = (
            supabase.table("splits")
            .select("""
                id,
                title,
                status,
                total_amount,
                paid_by,
                created_at,
                updated_at,
                settled_at,
                    
                paid_by_user_info:paid_by (
                    id,
                    name
                ),
                    
                split_members (
                    user_id,
                    amount_owed,
                    status,
                    user:user_id (
                        name
                    )
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

            paid_by_id = split.get("paid_by")
            paid_by_user_info = split.get("paid_by_user_info")
            is_settled = split["status"].lower() == "settled"

            members = []
            for m in split.get("split_members", []):
                user_id = m["user_id"]
                is_payer = user_id == paid_by_id
                member_status = m["status"]
                amount_owed = float(m["amount_owed"])

                # can_pay: non-payer, not settled, still pending, owes something
                can_pay = (
                    not is_settled
                    and not is_payer
                    and member_status == "pending"
                    and amount_owed > 0
                )

                members.append({
                    "user_id": user_id,
                    "name": (m.get("user") or {}).get("name"),   # joined from users table
                    "amount_owed": amount_owed,
                    "status": member_status,
                    "is_payer": is_payer,
                    "can_pay": can_pay,
                })

            # Top-level can_pay: true if the current user has a payable member entry
            current_user_can_pay = any(
                m["can_pay"] for m in members if m["user_id"] == current_user_id
            )

            splits.append({
                "id": split["id"],
                "title": split["title"],
                "status": split["status"],
                "total_amount": float(split["total_amount"] or 0),
                "paid_by_user_info": paid_by_user_info,
                "split_members": members,
                "split_members_count": len(members),
                "can_pay": current_user_can_pay,
                "created_at": split["created_at"],
                "updated_at": split["updated_at"],
                "settled_at": split["settled_at"],
            })

        return splits

    except HTTPException:
        raise

    except Exception as e:
        print("Error fetching split list:", str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch split list")