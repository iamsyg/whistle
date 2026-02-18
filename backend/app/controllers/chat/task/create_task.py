# backend/app/controllers/chat/task/create_task.py

from fastapi import HTTPException
from app.utils.supabase_client import supabase
from typing import List, Optional, Literal
from datetime import datetime, timezone


def create_task_controller(
    creator_id: str,
    chat_id: str,
    title: str,
    assignee_ids: List[str],
    description: Optional[str] = None,
    due_date: Optional[datetime] = None,
    task_status: Literal["pending", "in_progress", "completed"] = "pending",
):
    try:

        # Validation
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
                detail="Tasks cannot be created in classroom chats",
            )

        if not title or not title.strip():
            raise HTTPException(status_code=400, detail="Task title is required")

        if not assignee_ids:
            raise HTTPException(
                status_code=400,
                detail="At least one assignee is required",
            )

        # Normalize due_date to UTC ISO
        if due_date:
            if due_date.tzinfo is None:
                due_date = due_date.replace(tzinfo=timezone.utc)
            else:
                due_date = due_date.astimezone(timezone.utc)

        # Remove duplicate assignees
        unique_ids = list(set(assignee_ids))

        #Insert Task

        task_payload = {
            "chat_id": chat_id,
            "created_by": creator_id,
            "title": title.strip(),
            "description": description,
            "due_date": due_date.isoformat() if due_date else None,
            "status": task_status,
        }

        task_res = supabase.table("tasks").insert(task_payload).execute()

        if not task_res.data:
            raise HTTPException(status_code=500, detail="Failed to create task")

        created_task = task_res.data[0]
        task_id = created_task["id"]

    
        # Insert Task Assignees

        assignee_rows = [
            {
                "task_id": task_id,
                "user_id": uid,
            }
            for uid in unique_ids
        ]

        supabase.table("task_assignees").insert(assignee_rows).execute()

      
        # Create System Message (RPC)
      

        rpc_res = (
            supabase.rpc(
                "send_message_rpc",
                {
                    "p_chat_id": chat_id,
                    "p_sender_id": creator_id,
                    "p_content": None,
                    "p_message_type": "system",
                    "p_metadata": {
                        "type": "task",
                        "payload": {
                            "entity": "task",
                            "entity_id": task_id,
                            "action": "created",
                        },
                    },
                },
            ).execute()
        )

        if not rpc_res.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to create system message",
            )

        rpc_msg = rpc_res.data[0]
        message_id = rpc_msg["id"]

        # Link message_id to task
       

        update_res = supabase.table("tasks") \
            .update({"message_id": message_id}) \
            .eq("id", task_id) \
            .execute()

        if not update_res.data:
            raise HTTPException(500, "Failed to link message to task")


        # Fetch Hydrated Task

        task_with_relations = (
            supabase.table("tasks")
            .select(
                """
                *,
                creator:created_by (
                    id,
                    name,
                    username,
                    avatar_url
                ),
                assignees:task_assignees (
                    user_id,
                    status,
                    assigned_at,
                    user:user_id (
                        id,
                        name,
                        username,
                        avatar_url
                    )
                )
                """
            )
            .eq("id", task_id)
            .single()
            .execute()
        )

        if not task_with_relations.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to fetch hydrated task",
            )

        task_data = task_with_relations.data

        # Normalize assignees
     

        normalized_assignees = []

        for a in task_data.get("assignees", []):
            user = a.get("user") or {}

            normalized_assignees.append(
                {
                    "user_id": a.get("user_id"),
                    "status": a.get("status"),
                    "assigned_at": a.get("assigned_at"),
                    "name": user.get("name"),
                    "username": user.get("username"),
                    "avatar_url": user.get("avatar_url"),
                }
            )

        task_data["assignees"] = normalized_assignees

       
        # Return Normalized Message + Entities

        return {
            "id": rpc_msg.get("id"),
            "chat_id": rpc_msg.get("chat_id"),
            "sender_id": rpc_msg.get("sender_id"),

            "content": rpc_msg.get("content"),
            "message_type": rpc_msg.get("message_type"),
            "metadata": rpc_msg.get("metadata") or {},
            "reply_to_id": rpc_msg.get("reply_to_id"),

            "created_at": rpc_msg.get("created_at"),
            "edited_at": None,
            "deleted_at": None,

            "sender": rpc_msg.get("sender"),

            "entities": {
                "tasks": [task_data],
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error while creating task: {str(e)}",
        )
