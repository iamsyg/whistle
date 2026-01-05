# app/services/chat_service.py

from fastapi import WebSocketDisconnect
from fastapi.concurrency import run_in_threadpool
from app.controllers.chat_controller import save_message
from app.services.websocket_manager import manager
from app.utils.supabase_client import supabase
import asyncio
from datetime import datetime
from app.utils.rate_limit import RateLimiter
from backend.app.models.message import MessageCreate

rate_limiter = RateLimiter(max_messages=10, window_seconds=10)

async def handle_connection(ws, chat_id: str, user_id: str):

    membership = supabase.table("chat_members") \
        .select("chat_id") \
        .eq("chat_id", chat_id) \
        .eq("user_id", user_id) \
        .is_("left_at", None) \
        .execute()

    if not membership.data:
        print(f"Connection rejected: User {user_id} is not a member of chat {chat_id}")
        await ws.close(code=1008)
        return
    
    print(f"User {user_id} connected to chat {chat_id}")


    await manager.connect(ws, chat_id, user_id)

    async def send_heartbeat():
        try:
            while True:
                await asyncio.sleep(30)  # Every 30 seconds
                await ws.send_json({"type": "ping", "timestamp": datetime.utcnow().isoformat()})
        except:
            pass  # Connection closed
    
    heartbeat_task = asyncio.create_task(send_heartbeat())

    try:
        while True:
            data = await ws.receive_json()

            if data.get("type") == "pong":
                continue  # Just acknowledge, no action needed

            if "content" not in data or not data["content"].strip():
                continue

            if data.get("type") == "message":

                try: 
                # Check rate limit
                    if not rate_limiter.check_rate_limit(user_id):
                        await ws.send_json({
                            "type": "error",
                            "message": "Rate limit exceeded. Please slow down."
                        })
                        continue

                    msg_data = MessageCreate(**data)
                        
                    message = await run_in_threadpool(
                        save_message,
                        chat_id,
                        user_id,
                        msg_data.content,
                        msg_data.message_type,
                        msg_data.reply_to_id
                    )

                    await manager.broadcast(chat_id, {
                        "type": "message",
                        "data": message
                    })
                
                except ValueError as e:
                    await ws.send_json({
                        "type": "error",
                        "message": str(e)
                    })
                    continue


            # message = await run_in_threadpool(
            #     save_message,
            #     chat_id,
            #     user_id,
            #     data["content"]
            # )

            

    except WebSocketDisconnect:
        heartbeat_task.cancel()
        manager.disconnect(ws)
        print(f"WebSocket disconnected: {user_id} from chat {chat_id}")
    except Exception as e:
        heartbeat_task.cancel()
        manager.disconnect(ws)
        print(f"Error in WebSocket connection: {str(e)}")
        raise e
