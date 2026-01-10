# # app/services/websocket_manager.py

# from typing import Dict, Set
# from fastapi import WebSocket

# class WebSocketManager:
#     def __init__(self):
#         # chat_id -> set of websockets
#         self.active_connections: Dict[str, Set[WebSocket]] = {}

#     async def connect(self, websocket: WebSocket, chat_id: str):
#         await websocket.accept()

#         if chat_id not in self.active_connections:
#             self.active_connections[chat_id] = set()

#         self.active_connections[chat_id].add(websocket)

#     def disconnect(self, websocket: WebSocket, chat_id: str):
#         if chat_id in self.active_connections:
#             self.active_connections[chat_id].discard(websocket)

#             if not self.active_connections[chat_id]:
#                 del self.active_connections[chat_id]

#     async def broadcast(self, chat_id: str, message: dict):
#         if chat_id not in self.active_connections:
#             return

#         for ws in list(self.active_connections[chat_id]):
#             await ws.send_json(message)


# ws_manager = WebSocketManager()
