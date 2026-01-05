# # app/services/websocket_manager.py

# from typing import Dict, Set
# from fastapi import WebSocket

# class WebSocketManager:
#     def __init__(self):
#         # chat_id -> set of websockets
#         self.active_connections: Dict[str, Set[WebSocket]] = {}

#     async def connect(self, websocket: WebSocket, chat_id: str, user_id: str):
#         # await websocket.accept()

#         if chat_id in self.active_connections:
#             for ws, uid in list(self.active_connections[chat_id]):
#                 if uid == user_id:
#                     await ws.close(code=1000, reason="New connection established")
#                     self.disconnect(ws)

#         if chat_id not in self.active_connections:
#             self.active_connections[chat_id] = set()
            
#         self.active_connections[chat_id].add(websocket)

#     def disconnect(self, websocket: WebSocket, chat_id: str):
#         if chat_id in self.active_connections:
#             self.active_connections[chat_id].discard(websocket)
#             if not self.active_connections[chat_id]:
#                 del self.active_connections[chat_id]

#     # async def broadcast(self, chat_id: str, message: dict):
#     #     if chat_id not in self.active_connections:
#     #         return

#     #     for ws in list(self.active_connections[chat_id]):
#     #         try:
#     #             await ws.send_json(message)
#     #         except Exception as e:
#     #             print(f"Error sending message: {e}")
#     #             self.disconnect(ws, chat_id)

#     async def broadcast(self, chat_id: str, message: dict):
#         if chat_id not in self.active_connections:
#             return

#         # Create a snapshot to avoid modification during iteration
#         connections = list(self.active_connections[chat_id])
#         disconnected = []
        
#         for ws in connections:
#             try:
#                 await ws.send_json(message)
#             except Exception as e:
#                 print(f"Error sending message: {e}")
#                 disconnected.append(ws)
        
#         # Clean up failed connections after iteration
#         for ws in disconnected:
#             self.disconnect(ws, chat_id)




# manager = WebSocketManager()
