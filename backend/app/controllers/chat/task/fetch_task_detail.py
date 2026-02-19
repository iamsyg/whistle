# backend/app/controllers/chat/task/fetch_task_detail.py

from fastapi import HTTPException
from app.utils.supabase_client import supabase


async def fetch_task_details_controller(chat_id: str, current_user_id: str, task_id: str):
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
                detail="Tasks details cannot be fetched in classroom chats",
            )
        

        # Fetch task with creator and assignees
        res = (
            supabase.table("tasks")
            .select("""
                id,
                chat_id,
                message_id,
                title,
                description,
                status,
                due_date,
                created_at,
                updated_at,
                updated_by,

                creator:created_by (
                    id,
                    name,
                    username,
                    avatar_url
                ),
                    
                updater:updated_by (
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
            """)
            .eq("id", task_id)
            .eq("chat_id", chat_id)
            .single()
            .execute()
        )

        if not res.data:
            raise HTTPException(status_code=404, detail="Task not found")

        task = res.data

        # Normalize creator
        creator = task.get("creator") or {}

        # Normalize assignees
        normalized_assignees = []

        updater = task.get("updater") or {}

        for row in task.get("assignees") or []:
            user = row.get("user") or {}

            normalized_assignees.append({
                "user_id": row["user_id"],
                "name": user.get("name"),
                "username": user.get("username"),
                "avatar_url": user.get("avatar_url"),
                "status": row.get("status"),
                "assigned_at": row.get("assigned_at")
            })

        return {
            "id": task["id"],
            "chat_id": task["chat_id"],
            "message_id": task.get("message_id"),
            "title": task["title"],
            
            "description": task.get("description"),
            "created_by": creator.get("id"),
            "due_date": task.get("due_date"),

            "status": task["status"],
            "created_at": task["created_at"],
            "updated_at": task["updated_at"],

            "creator": {
                "id": creator.get("id"),
                "name": creator.get("name"),
                "username": creator.get("username"),
                "avatar_url": creator.get("avatar_url")
            },

            # "created_by": creator.get("id"),
            # "creator_name": creator.get("name"),
            # "creator_username": creator.get("username"),
            # "creator_avatar": creator.get("avatar_url"),

            "assignees": normalized_assignees,

            "updater": {
                "id": updater.get("id"),
                "name": updater.get("name"),
                "username": updater.get("username"),
                "avatar_url": updater.get("avatar_url")
            }

            # "updated_by": updater.get("id"),
            # "updater_name": updater.get("name"),
            # "updater_avatar": updater.get("avatar_url"),
            # "updater_username": updater.get("username"),
        }

    except Exception as e:
        print(f"Error fetching task details: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch task details")
