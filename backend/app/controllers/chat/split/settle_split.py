# backend/app/controllers/chat/split/settle_split.py

from fastapi import HTTPException
from app.utils.supabase_client import supabase
from datetime import datetime, timezone

from app.controllers.chat.split._fetch_split_snapshot import _fetch_split_snapshot
 
 
def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

# SETTLE: called when the payer clicks "Settle Split"
#   - marks ALL pending members as paid
#   - marks the split itself as settled
def settle_split_controller(split_id: str, current_user_id: str):
    try:
        # 1. Load the split to get chat_id
        split_res = (
            supabase.table("splits")
            .select("id, chat_id, status, paid_by")
            .eq("id", split_id)
            .single()
            .execute()
        )
 
        if not split_res.data:
            raise HTTPException(status_code=404, detail="Split not found")
 
        split = split_res.data
        chat_id = split["chat_id"]
 
        # 2. Membership + chat type check
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
 
        # 3. Guard: only the payer can settle
        if split["paid_by"] != current_user_id:
            raise HTTPException(
                status_code=403,
                detail="Only the payer can settle the split",
            )
 
        # 4. Guard: must still be pending
        if split["status"] != "pending":
            raise HTTPException(
                status_code=400,
                detail=f"Split is already {split['status']}",
            )
 
        now = _now_iso()
 
        # 5. Mark all pending members as paid
        supabase.table("split_members").update({
            "status": "paid",
            "paid_at": now,
        }).eq("split_id", split_id).eq("status", "pending").execute()
 
        # 6. Settle the split
        settle_res = (
            supabase.table("splits")
            .update({"status": "settled", "settled_at": now})
            .eq("id", split_id)
            .execute()
        )
 
        if not settle_res.data:
            raise HTTPException(status_code=500, detail="Failed to settle split")
 
        # 7. Return normalised snapshot
        return _fetch_split_snapshot(split_id, current_user_id)
 
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error while settling split: {str(e)}",
        )