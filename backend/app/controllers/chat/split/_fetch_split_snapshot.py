# backend/app/controllers/chat/split/_fetch_split_snapshot.py

from fastapi import HTTPException
from app.utils.supabase_client import supabase
from datetime import datetime, timezone



def _fetch_split_snapshot(split_id: str, current_user_id: str) -> dict:
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
                paid_at,
                user:user_id (
                    name
                )
            )
        """)
        .eq("id", split_id)
        .single()
        .execute()
    )
 
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to fetch updated split")
 
    split = res.data
    paid_by_id = split.get("paid_by")
    is_settled = (split.get("status") or "").lower() == "settled"
 
    members = []
    for m in split.get("split_members", []):
        user_id = m["user_id"]
        is_payer = user_id == paid_by_id
        member_status = m["status"]
        amount_owed = float(m["amount_owed"])
 
        can_pay = (
            not is_settled
            and not is_payer
            and member_status == "pending"
            and amount_owed > 0
        )
 
        members.append({
            "user_id": user_id,
            "name": (m.get("user") or {}).get("name"),
            "amount_owed": amount_owed,
            "status": member_status,
            "paid_at": m.get("paid_at"),
            "is_payer": is_payer,
            "can_pay": can_pay,
        })
 
    current_user_can_pay = any(
        m["can_pay"] for m in members if m["user_id"] == current_user_id
    )
 
    return {
        "id": split["id"],
        "title": split["title"],
        "status": split["status"],
        "total_amount": float(split["total_amount"] or 0),
        "paid_by_user_info": split.get("paid_by_user_info"),
        "split_members": members,
        "split_members_count": len(members),
        "can_pay": current_user_can_pay,
        "created_at": split["created_at"],
        "updated_at": split["updated_at"],
        "settled_at": split["settled_at"],
    }