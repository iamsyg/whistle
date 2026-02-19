# backend/app/controllers/chat/task/fetch_task.py

from fastapi import HTTPException
from app.utils.supabase_client import supabase


async def fetch_tasks_controller(chat_id: str, current_user_id: str):
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
                detail="Tasks cannot exist in classroom chats",
            )

        # ✅ Fetch ALL tasks of this chat
        res = (
            supabase.table("tasks")
            .select("""
                id,
                title,
                description,
                due_date,
                status,
                assignees:task_assignees (
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

        tasks = []

        for task in res.data:

            assignee_names = []

            for row in task.get("assignees") or []:
                user = row.get("user") or {}
                if user.get("name"):
                    assignee_names.append(user.get("name"))

            tasks.append({
                "id": task["id"],
                "chat_id": chat_id,
                "title": task["title"],
                "description": task.get("description"),
                "due_date": task.get("due_date"),
                "status": task.get("status"),
                "assignees": assignee_names,
            })

        return tasks

    except HTTPException:
        raise

    except Exception as e:
        print(f"Error fetching tasks: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch tasks")

