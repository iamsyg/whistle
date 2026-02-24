# backend/app/controllers/chat/split/create_split.py

from fastapi import HTTPException
from app.utils.supabase_client import supabase
from typing import List, Literal, Optional
from decimal import Decimal


def create_split_controller(
    creator_id: str,
    chat_id: str,
    total_amount: Decimal,
    members: List[dict],          # [{ "user_id": str, "amount_owed": Decimal  }]
    paid_by: str,                # user_id of the payer
    split_type: Literal["equally", "unequally"] = "equally",
    title: Optional[str] = None,
    currency: str = "INR",
):
    try:

        # Combined membership + chat type check
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
            .eq("user_id", creator_id)
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
                detail="Splits cannot be created in classroom chats",
            )

        if total_amount <= 0:
            raise HTTPException(status_code=400, detail="Total amount must be greater than 0")

        if len(members) < 2:
            raise HTTPException(status_code=400, detail="At least 2 members are required")

        # Deduplicate members by user_id
        seen = set()
        unique_members = []

        for m in members:
            if m["user_id"] not in seen:
                seen.add(m["user_id"])
                unique_members.append(m)

        # payers = [m for m in unique_members if m.get("is_payer")]

        # if len(payers) != 1:
        #     raise HTTPException(status_code=400, detail="Exactly one member must be marked as is_payer")


        # validate paid_by is one of the members
        if paid_by not in {m["user_id"] for m in unique_members}:
            raise HTTPException(status_code=400, detail="paid_by must be one of the split members")


        total_owed = sum(Decimal(str(m["amount_owed"])) for m in unique_members)

        if abs(total_owed - Decimal(str(total_amount))) > Decimal("0.01"):
            raise HTTPException(
                status_code=400,
                detail=f"Sum of member amounts ({total_owed}) does not match total_amount ({total_amount})",
            )

        # Verify all members are active chat members
        member_ids = [m["user_id"] for m in unique_members]

        members_check = (
            supabase.table("chat_members")
            .select("user_id")
            .eq("chat_id", chat_id)
            .in_("user_id", member_ids)
            .is_("left_at", None)
            .execute()
        )

        found_ids = {r["user_id"] for r in (members_check.data or [])}
        missing = set(member_ids) - found_ids

        if missing:
            raise HTTPException(
                status_code=422,
                detail=f"These users are not members of the chat: {list(missing)}",
            )


        split_payload = {
            "chat_id":    chat_id,
            "created_by": creator_id,
            "paid_by":    paid_by,
            "title":      title.strip() if title else None,
            "total_amount": str(total_amount),
            "currency":   currency,
            "split_type": split_type,
        }

        split_res = supabase.table("splits").insert(split_payload).execute()

        if not split_res.data:
            raise HTTPException(status_code=500, detail="Failed to create split")

        created_split = split_res.data[0]
        split_id = created_split["id"]


        member_rows = [
            {
                "split_id":    split_id,
                "user_id":     m["user_id"],
                "amount_owed": str(m["amount_owed"]),
                # "paid_by":     m.get("paid_by", None),
            }
            for m in unique_members
        ]

        # supabase.table("split_members").insert(member_rows).execute()
    
        members_insert = supabase.table("split_members").insert(member_rows).execute()
        
        if not members_insert.data:
            raise HTTPException(status_code=500, detail="Failed to create split members")


        rpc_res = (
            supabase.rpc(
                "send_message_rpc",
                {
                    "p_chat_id":      chat_id,
                    "p_sender_id":    creator_id,
                    "p_content":      None,
                    "p_message_type": "system",
                    "p_metadata": {
                        "type": "split",
                        "payload": {
                            "entity":    "split",
                            "entity_id": split_id,
                            "action":    "created",
                        },
                    },
                },
            ).execute()
        )

        if not rpc_res.data:
            raise HTTPException(status_code=500, detail="Failed to create system message")

        rpc_msg = rpc_res.data[0]
        message_id = rpc_msg["id"]


        update_res = (
            supabase.table("splits")
            .update({"message_id": message_id})
            .eq("id", split_id)
            .execute()
        )

        if not update_res.data:
            raise HTTPException(status_code=500, detail="Failed to link message to split")


        split_with_relations = (
            supabase.table("splits")
            .select(
                """
                *,
                creator:created_by (
                    id,
                    name,
                    username,
                    avatar_url
                ),
                members:split_members (
                    user_id,
                    amount_owed,
                    status,
                    paid_at,
                    created_at,
                    user:user_id (
                        id,
                        name,
                        username,
                        avatar_url
                    )
                )
                """
            )
            .eq("id", split_id)
            .single()
            .execute()
        )

        if not split_with_relations.data:
            raise HTTPException(status_code=500, detail="Failed to fetch hydrated split")

        split_data = split_with_relations.data

        paid_by_id = split_data.get("paid_by")


        normalized_members = []
        for m in split_data.get("members", []):

            user = m.get("user") or {}
            is_payer = (m.get("user_id") == paid_by_id)

            normalized_members.append(
                {
                    "user_id":     m.get("user_id"),
                    "is_payer":    is_payer,
                    "amount_owed": float(m.get("amount_owed")),
                    "status":      m.get("status"),
                    "paid_at":     m.get("paid_at"),
                    # can_pay: only the payer who hasn't paid yet sees the Pay button
                    "can_pay":  not is_payer and m.get("status") == "pending",
                    "name":        user.get("name"),
                    "username":    user.get("username"),
                    "avatar_url":  user.get("avatar_url"),
                }
            )

        split_data["members"] = normalized_members

        # Return Normalized Message + Entities 

        return {
            "id":           rpc_msg.get("id"),
            "chat_id":      rpc_msg.get("chat_id"),
            "sender_id":    rpc_msg.get("sender_id"),

            "content":      rpc_msg.get("content"),
            "message_type": rpc_msg.get("message_type"),
            "metadata":     rpc_msg.get("metadata") or {},
            "reply_to_id":  rpc_msg.get("reply_to_id"),

            "created_at":   rpc_msg.get("created_at"),
            "edited_at":    None,
            "deleted_at":   None,

            "sender":       rpc_msg.get("sender"),

            "entities": {
                "splits": [split_data],
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error while creating split: {str(e)}",
        )