# backend/app/controllers/chat/task/update_task_details.py

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException
from app.utils.supabase_client import supabase
from app.controllers.chat.task.fetch_task_detail import fetch_task_details_controller


async def update_task_details_controller(
    chat_id: str,
    task_id: str,
    current_user_id: str,
    title: str = None,
    description: str = None,
    status: str = None,
    due_date: Optional[datetime] = None,
    assignees: Optional[List[str]] = None
):
    try:

        # --------------------------------------------------
        # 1️⃣ Verify membership
        # --------------------------------------------------
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
                detail="Tasks details cannot be updated in classroom chats",
            )
        


        # --------------------------------------------------
        # 2️⃣ Fetch task
        # --------------------------------------------------
        task_res = (
            supabase.table("tasks")
            .select("id, created_by")
            .eq("id", task_id)
            .eq("chat_id", chat_id)
            .limit(1)
            .execute()
        )

        if not task_res.data:
            raise HTTPException(status_code=404, detail="Task not found")

        task = task_res.data[0]
        is_creator = task["created_by"] == current_user_id

        now = datetime.now(timezone.utc).isoformat()

        # If user is CREATOR → full control
    
        if is_creator:

            # Creator cannot update status
            # if status is not None:
            #     raise HTTPException(
            #         status_code=403,
            #         detail="Task creator cannot update task status - only
            #         assigned members can update their own status"
            #     ) 

            update_payload = {
                "updated_by": current_user_id,
                "updated_at": now
            }

            if title is not None:
                update_payload["title"] = title.strip()

            if description is not None:
                update_payload["description"] = description

            if status is not None:
                update_payload["status"] = status

            if due_date is not None:
                dt = due_date

                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)

                update_payload["due_date"] = dt.astimezone(timezone.utc).isoformat()

            # Only update if there's something to update
            if len(update_payload) > 2:
                supabase.table("tasks") \
                    .update(update_payload) \
                    .eq("id", task_id) \
                    .execute()

        
            # Update assignees (creator only)
          
            if assignees is not None:

                existing_res = (
                    supabase.table("task_assignees")
                    .select("user_id")
                    .eq("task_id", task_id)
                    .execute()
                )

                existing_ids = {a["user_id"] for a in existing_res.data}
                # new_ids = {a["user_id"] for a in assignees}
                new_ids = set(assignees)

                # Remove users
                to_remove = existing_ids - new_ids
                if to_remove:
                    supabase.table("task_assignees") \
                        .delete() \
                        .eq("task_id", task_id) \
                        .in_("user_id", list(to_remove)) \
                        .execute()

                # Add users
                to_add = new_ids - existing_ids
                if to_add:
                    rows = [{
                        "task_id": task_id,
                        "user_id": uid,
                        "assigned_at": now,
                        "status": "pending",
                        "updated_at": now
                    } for uid in to_add]

                    supabase.table("task_assignees").insert(rows).execute()

                # Update status for listed users
                # for a in assignees:
                #     if "status" in a:
                #         supabase.table("task_assignees") \
                #             .update({
                #                 "status": a["status"],
                #                 "updated_at": now
                #             }) \
                #             .eq("task_id", task_id) \
                #             .eq("user_id", a["user_id"]) \
                #             .execute()

        # If NOT creator → only allowed actions

        else:

            # Check if user is assigned
            assigned_res = (
                supabase.table("task_assignees")
                .select("user_id")
                .eq("task_id", task_id)
                .eq("user_id", current_user_id)
                .limit(1)
                .execute()
            )

            print(f"assigned_res.data: {assigned_res.data}")  # Is this empty?

            if not assigned_res.data:
                raise HTTPException(
                    status_code=403,
                    detail="Only creator or assigned member can modify this task"
                )

            # Prevent changing task details
            if any(v is not None for v in [title, description, due_date, assignees]):
                raise HTTPException(
                    status_code=403,
                    detail="Only task creator can modify task details or assignees"
                )

            # Allow updating own status
            if status is not None:

                if status not in ["pending", "in_progress", "completed"]:
                    raise HTTPException(
                        status_code=400,
                        detail="Invalid status value"
                    )

                print(f"Updating task_assignees: task_id={task_id!r}, user_id={current_user_id!r}, status={status!r}")
                
                result = supabase.table("task_assignees") \
                    .update({
                        "status": status,
                        "updated_at": now
                    }) \
                    .eq("task_id", task_id) \
                    .eq("user_id", current_user_id) \
                    .execute()
                
                print(f"Update result: {result.data}")  # If empty list, no rows matched

        
        check = supabase.table("task_assignees") \
            .select("*") \
            .eq("task_id", task_id) \
            .eq("user_id", current_user_id) \
            .execute()
        print(f"Assignee row check: {check.data}")

        # Return updated task
  
        return await fetch_task_details_controller(
            chat_id, current_user_id, task_id
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error while updating task: {str(e)}"
        )