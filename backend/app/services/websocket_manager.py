# app/services/websocket_manager.py

from typing import Dict
from fastapi import WebSocket
import traceback

class WebSocketManager:
    def __init__(self):
        # ✅ FIXED: Dict[chat_id -> Dict[user_id -> WebSocket]]
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, websocket: WebSocket, chat_id: str, user_id: str):
        """
        Connect a user's WebSocket to a chat room
        """
        await websocket.accept()
        print(f"✅ WebSocket accepted for user {user_id} in chat {chat_id}")

        # ✅ Initialize chat room if it doesn't exist
        if chat_id not in self.active_connections:
            self.active_connections[chat_id] = {}

        # ✅ Store the WebSocket connection
        self.active_connections[chat_id][user_id] = websocket
        print(f"✅ User {user_id} connected to chat {chat_id}")
        print(f"📊 Active connections in chat {chat_id}: {len(self.active_connections[chat_id])}")

    def disconnect(self, chat_id: str, user_id: str):
        """
        Disconnect a user from a chat room
        """
        # ✅ FIXED: Proper disconnect logic
        if chat_id in self.active_connections:
            if user_id in self.active_connections[chat_id]:
                del self.active_connections[chat_id][user_id]
                print(f"✅ User {user_id} disconnected from chat {chat_id}")
                print(f"📊 Remaining connections in chat {chat_id}: {len(self.active_connections[chat_id])}")

            # Clean up empty chat rooms
            if not self.active_connections[chat_id]:
                del self.active_connections[chat_id]
                print(f"🧹 Cleaned up empty chat room {chat_id}")

    async def broadcast(self, chat_id: str, message: dict, exclude_user: str = None):
        """
        Broadcast a message to all users in a chat room
        
        Args:
            chat_id: The chat room ID
            message: The message to broadcast
            exclude_user: Optional user_id to exclude from broadcast (e.g., the sender)
        """
        if chat_id not in self.active_connections:
            print(f"⚠️  No active connections for chat {chat_id}")
            return

        connections = self.active_connections[chat_id]
        print(f"📤 Broadcasting to {len(connections)} users in chat {chat_id}")

        # ✅ Broadcast to all connected users (except excluded)
        disconnected_users = []
        
        for user_id, ws in connections.items():
            # Skip excluded user (typically the sender)
            if exclude_user and user_id == exclude_user:
                continue

            try:
                await ws.send_json(message)
                print(f"✅ Sent message to user {user_id}")
            except Exception as e:
                print(f"❌ Failed to send to user {user_id}: {str(e)}")
                disconnected_users.append(user_id)

        # ✅ Clean up disconnected users
        for user_id in disconnected_users:
            self.disconnect(chat_id, user_id)

    def get_active_users(self, chat_id: str) -> list[str]:
        """
        Get list of active user IDs in a chat
        """
        if chat_id not in self.active_connections:
            return []
        return list(self.active_connections[chat_id].keys())

    def is_user_connected(self, chat_id: str, user_id: str) -> bool:
        """
        Check if a user is connected to a chat
        """
        return (
            chat_id in self.active_connections and
            user_id in self.active_connections[chat_id]
        )


# ✅ Singleton instance
ws_manager = WebSocketManager()