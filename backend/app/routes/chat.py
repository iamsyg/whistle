# # app/routers/chat.py
# from fastapi import APIRouter, Depends
# from app.controllers.chat_controller import create_direct_chat

# router = APIRouter(prefix="/chat", tags=["Chat"])

# @router.post("/direct")
# def create_direct_chat_route(users: list[str]):
#     """
#     Create a direct chat between 2 users
#     """
#     if len(users) != 2:
#         raise ValueError("Direct chat must have exactly 2 users")

#     chat = create_direct_chat(users, creator_id=users[0])
#     return chat
