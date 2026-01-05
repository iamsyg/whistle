# # app/routers/chat_ws.py

# from fastapi import APIRouter, WebSocket
# from app.services.chat_service import handle_connection
# from app.utils.supabase_client import supabase
# from app.utils.auth import verify_jwt_token

# router = APIRouter()


# @router.websocket("/ws/chat/{chat_id}")
# async def chat_ws(websocket: WebSocket, chat_id: str):

#     await websocket.accept()  # Accept first to send close messages
    
#     try:
#         # Option 1: Query parameter
#         token = websocket.query_params.get("token")
        
#         if not token:
#             await websocket.send_json({"error": "Missing authentication token"})
#             await websocket.close(code=1008)
#             return
        
#         user_id = verify_jwt_token(token)
        
#     except Exception as e:
#         await websocket.send_json({"error": str(e)})
#         await websocket.close(code=1008)
#         return
    
#     # Now proceed with verified user_id
#     await handle_connection(websocket, chat_id, user_id)