# app/routes/ws.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.services.websocket_manager import ws_manager
from app.middlewares.secure_route import verify_jwt_token_ws
import traceback
from datetime import datetime
from app.utils.supabase_client import supabase

router = APIRouter()

@router.websocket("/ws/chat/{chat_id}")
async def websocket_chat(
    websocket: WebSocket,
    chat_id: str,
    token: str = Query(...)
):
    """
    WebSocket endpoint for real-time chat
    """
    print(f"========================================")
    print(f"🌐 WebSocket connection attempt START")
    print(f"   Chat ID: {chat_id}")
    print(f"   Token (first 50): {token[:50] if token else 'NO TOKEN'}...")
    print(f"========================================")
    
    user_id = None
    
    try:
        print("🔐 Step 1: Verifying token...")
        user_id = verify_jwt_token_ws(token)
        print(f"✅ Step 1 complete: User ID = {user_id}")
        
        if not user_id:
            print(f"❌ No user_id extracted")
            await websocket.close(code=1008, reason="Unauthorized")
            return
        
        # 🔐 Check membership FIRST
        member_res = supabase.table("chat_members") \
            .select("user_id, chat_id")\
            .eq("chat_id", chat_id) \
            .eq("user_id", user_id) \
            .execute()
        
        print("🤝 Step 1.5: Membership check result:", member_res)

        if not member_res.data:
            await websocket.close(code=1008, reason="Forbidden")
            return

        print(f"🤝 Step 2: Accepting WebSocket connection...")
        await ws_manager.connect(websocket, chat_id, user_id)
        print(f"✅ Step 2 complete: Connection accepted")

        print(f"📢 Step 3: Broadcasting user_joined event...")
        await ws_manager.broadcast(
            chat_id,
            {
                "type": "user_joined",
                "user_id": user_id,
                "timestamp": str(datetime.now())
            },
            exclude_user=user_id
        )
        print(f"✅ Step 3 complete: Broadcast sent")

        print(f"♾️  Step 4: Entering message loop...")
        while True:
            try:
                data = await websocket.receive_text()
                print(f"📥 Received from {user_id}: {data}")
                
            except WebSocketDisconnect:
                print(f"🔌 User {user_id} disconnected normally")
                break
            except Exception as e:
                print(f"❌ Error in message loop: {str(e)}")
                break

    except Exception as e:
        print(f"❌❌❌ CRITICAL ERROR ❌❌❌")
        print(f"   Error: {str(e)}")
        print(f"   Type: {type(e).__name__}")
        print(traceback.format_exc())
        try:
            await websocket.close(code=1011, reason="Internal server error")
        except:
            pass
    finally:
        print(f"🧹 Cleanup: Disconnecting user {user_id}")
        if user_id:
            ws_manager.disconnect(chat_id, user_id)
            try:
                await ws_manager.broadcast(
                    chat_id,
                    {
                        "type": "user_left",
                        "user_id": user_id,
                        "timestamp": str(datetime.now())
                    }
                )
            except:
                pass
        print(f"========================================")
        print(f"🌐 WebSocket connection END")
        print(f"========================================")