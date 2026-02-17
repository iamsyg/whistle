# backend/app/controllers/chat/task/create_task.py

# Fix api response structure and ensure task creation is atomic with system message creation

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
       
        # Basic Validations
       
        if not title or not title.strip():
            raise HTTPException(status_code=400, detail="Task title is required")

        if task_status not in ["pending", "in_progress", "completed"]:
            raise HTTPException(status_code=400, detail="Invalid task status")

        if not assignee_ids or len(assignee_ids) == 0:
            raise HTTPException(
                status_code=400,
                detail="At least one assignee is required"
            )

        if due_date:
            if due_date.tzinfo is None:
                due_date = due_date.replace(tzinfo=timezone.utc)
            else:
                due_date = due_date.astimezone(timezone.utc)

       
        # Insert Task
   
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


        # Insert Assignees
     
        unique_ids = list(set(assignee_ids))

        assignee_rows = [
            {
                "task_id": task_id,
                "user_id": user_id,
            }
            for user_id in unique_ids
        ]

        assignee_res = (
            supabase
            .table("task_assignees")
            .insert(assignee_rows)
            .execute()
        )

        if not assignee_res.data:
            raise HTTPException(status_code=500, detail="Failed to assign task")

     
        # Insert System Message
     
        system_message_payload = {
            "chat_id": chat_id,
            "sender_id": creator_id,
            "message_type": "system",
            "content": None,
            "metadata": {
                "entity": "task",
                "entity_id": task_id,
                "action": "created",
            },
        }

        message_res = (
            supabase
            .table("messages")
            .insert(system_message_payload)
            .execute()
        )

        if not message_res.data:
            raise HTTPException(status_code=500, detail="Failed to create system message")

        system_message = message_res.data[0]
        message_id = system_message["id"]

        # After creating system message
        supabase.table("tasks").update(
            {"message_id": message_id}
        ).eq("id", task_id).execute()

      
        # Update chat.last_message_id
       

        supabase.table("chat").update(
            {
                "last_message_id": message_id,
                "last_message_at": system_message["created_at"],
            }
        ).eq("id", chat_id).execute()

      
        # Return Response
      
        # return {
        #     "task": created_task,
        #     "assignees": assignee_res.data,
        #     "system_message": system_message,
        # }

        return {
            "message": system_message,
            "entities": {
                "tasks": [created_task],
                "users": assignee_res.data,
            }
        }


    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error while creating task: {str(e)}"
        )
