# # app/routes/ws.py

# from fastapi import APIRouter, WebSocket, WebSocketDisconnect
# from app.services.websocket_manager import ws_manager
# from app.middlewares.secure_route import verify_jwt_token

# router = APIRouter()

# @router.websocket("/ws/chat/{chat_id}")
# async def websocket_chat(websocket: WebSocket, chat_id: str):
#     # 🔐 JWT via query param
#     token = websocket.query_params.get("token")
#     if not token:
#         await websocket.close(code=1008)
#         return

#     try:
#         user_id = verify_jwt_token(token)
#     except Exception:
#         await websocket.close(code=1008)
#         return

#     await ws_manager.connect(websocket, chat_id)

#     try:
#         while True:
#             # Keep connection alive
#             await websocket.receive_text()
#     except WebSocketDisconnect:
#         ws_manager.disconnect(websocket, chat_id)
#         print(f"User {user_id} disconnected from chat {chat_id}")