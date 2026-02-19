# backend/app/routes/chat.py

from datetime import datetime
import traceback
from fastapi import APIRouter, Depends, Body, HTTPException, Query
from pyparsing import Literal, Optional

from app.controllers.messages.send_chat_messages import send_chat_messages
from app.controllers.messages.get_chat_messages import get_chat_messages

from app.controllers.chat.fetch_members.fetch_members import fetch_chat_members_controller

from app.controllers.chat.task.create_task import create_task_controller

from app.controllers.chat.task.fetch_task_list import fetch_task_list_controller

from app.controllers.chat.task.fetch_task_detail import fetch_task_details_controller

from app.controllers.conversation_controller import get_or_create_direct_chat_controller
from app.middlewares.secure_route import verify_jwt_token
from app.services.websocket_manager import ws_manager

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/send/{chat_id}")
async def send_message_endpoint(
    chat_id: str,
    content: str = Body(..., embed=True),
    sender_id: str = Depends(verify_jwt_token)
):
    """
    Send message to a user (direct chat)
    """

    try: 

        print(f"📤 Sending message to chat {chat_id} from user {sender_id}")

        message = await send_chat_messages(
            sender_id=sender_id,
            chat_id=chat_id,
            content=content
        )

        await ws_manager.broadcast(chat_id, {
            "type": "new_message",
            "data": message
        })

        print(f"✅ Message broadcasted to chat {chat_id}")

        return message
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error sending message: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
    

@router.post("/direct/send/{receiver_id}")
async def send_direct_message_endpoint(
    receiver_id: str,
    content: str = Body(..., embed=True),
    sender_id: str = Depends(verify_jwt_token)
):
    chat_id = await get_or_create_direct_chat_controller(
        sender_id=sender_id,
        other_user_id=receiver_id
    )

    message = await send_chat_messages(
        sender_id=sender_id,
        chat_id=chat_id,
        content=content
    )

    await ws_manager.broadcast(chat_id, {
        "type": "new_message",
        "data": message
    })

    return {
        "chat_id": chat_id,
        "message": message
    }


@router.get("/direct/get/{chat_id}")
async def get_messages_endpoint(
    chat_id: str,
    sender_id: str = Depends(verify_jwt_token)
):
    """
    Get messages of a direct chat
    """

    try:

        messages = await get_chat_messages(
            sender_id=sender_id,
            chat_id=chat_id
        )

        return messages
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching messages: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/{chat_id}/members")
async def get_chat_members_endpoint(
    chat_id: str,
    user_id: str = Depends(verify_jwt_token)
):
    """
    Get members of a chat
    """

    try:
        members = await fetch_chat_members_controller(chat_id, user_id)

        print(f"✅ Fetched members for chat {chat_id}: {members}")
        return members
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching chat members: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
    


@router.post("/task/create/{chat_id}")
async def create_task_endpoint(
    chat_id: str,
    title: str = Body(..., embed=True),
    assignee_ids: list[str] = Body(..., embed=True),
    description: str = Body(None, embed=True),
    due_date: datetime | None = Body(None, embed=True),
    task_status: str = Body(..., embed=True),
    creator_id: str = Depends(verify_jwt_token),
):

    try:
        print(f"/task/create/chat_id: {chat_id} creator_id: {creator_id} title: {title} assignee_ids: {assignee_ids} description: {description} due_date: {due_date} task_status: {task_status}")

        task = create_task_controller(
            chat_id=chat_id,
            creator_id=creator_id,
            title=title,
            description=description,
            due_date=due_date,
            task_status=task_status,
            assignee_ids=assignee_ids
        )

        return task
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creating task: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/{chat_id}/tasks")
async def fetch_tasks_endpoint(
    chat_id: str,
    user_id: str = Depends(verify_jwt_token)
):
    """
    Get tasks of a chat
    """

    try:
        tasks = await fetch_task_list_controller(chat_id, user_id)

        print(f"✅ Fetched tasks for chat {chat_id}: {tasks}")
        return tasks
    
    except HTTPException:
        raise

    except Exception as e:
        print(f"❌ Error fetching chat tasks: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/{chat_id}/task/{task_id}")
async def fetch_task_details_endpoint(
    chat_id: str,
    task_id: str,
    user_id: str = Depends(verify_jwt_token)
):
    """
    Get details of a specific task
    """

    try:
        task = await fetch_task_details_controller(chat_id, user_id, task_id)

        print(f"✅ Fetched task details for task {task_id}: {task}")
        return task
    
    except HTTPException:
        raise

    except Exception as e:
        print(f"❌ Error fetching task details: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))