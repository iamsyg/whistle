# backend/app/controllers/chat/split/pay_split.py
 
from fastapi import HTTPException
from app.utils.supabase_client import supabase
from datetime import datetime, timezone

from app.controllers.chat.split._fetch_split_snapshot import _fetch_split_snapshot
 
 
def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def pay_split_controller(split_id: str, current_user_id: str):
    try:
        # 1. Fetch split
        split_res = (
            supabase.table("splits")
            .select("""
                id,
                chat_id,
                status,
                paid_by,
                split_members (
                    user_id,
                    status,
                    amount_owed
                )
            """)
            .eq("id", split_id)
            .single()
            .execute()
        )

        if not split_res.data:
            raise HTTPException(status_code=404, detail="Split not found")

        split = split_res.data
        chat_id = split["chat_id"]
        members = split.get("split_members", [])
        paid_by_id = split.get("paid_by")

        # 2. Membership check
        membership_check = (
            supabase.table("chat_members")
            .select("user_id, chat:chat_id(type)")
            .eq("chat_id", chat_id)
            .eq("user_id", current_user_id)
            .is_("left_at", None)
            .limit(1)
            .execute()
        )

        if not membership_check.data:
            raise HTTPException(status_code=403, detail="Access denied")

        if membership_check.data[0]["chat"]["type"] == "classroom":
            raise HTTPException(
                status_code=403,
                detail="Splits cannot exist in classroom chats",
            )

        # 3. Split must be pending
        if split["status"] != "pending":
            raise HTTPException(
                status_code=400,
                detail=f"Split is already {split['status']}",
            )

        # 4. Validate user in split
        my_entry = next((m for m in members if m["user_id"] == current_user_id), None)

        if not my_entry:
            raise HTTPException(
                status_code=403,
                detail="You are not a payee of this split",
            )

        if current_user_id == paid_by_id:
            raise HTTPException(
                status_code=400,
                detail="Payer cannot use Pay Now — use Settle Split instead",
            )

        if my_entry["status"] == "paid":
            raise HTTPException(
                status_code=400,
                detail="You have already paid your share"
            )

        if float(my_entry["amount_owed"]) <= 0:
            raise HTTPException(
                status_code=400,
                detail="No payment required for this split",
            )

        # 5. Mark paid (DB trigger will handle settlement)
        now = _now_iso()
        mark_res = (
            supabase.table("split_members")
            .update({"status": "paid", "paid_at": now})
            .eq("split_id", split_id)
            .eq("user_id", current_user_id)
            .execute()
        )

        if not mark_res.data:
            raise HTTPException(status_code=500, detail="Failed to mark payment")

        # 6. Return snapshot
        return _fetch_split_snapshot(split_id, current_user_id)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error while paying split: {str(e)}",
        )