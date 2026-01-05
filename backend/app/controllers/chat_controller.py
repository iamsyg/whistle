# # app/controllers/chat_controller.py

# from app.utils.supabase_client import supabase

# def create_direct_chat(user_ids: list[str], creator_id: str) -> dict:
#     """
#     Create a direct chat between 2 users
#     """

#     if len(user_ids) != 2:
#         raise ValueError("Direct chat must have exactly 2 users")

#     user1, user2 = user_ids

#     res = supabase.rpc("get_or_create_direct_chat", {
#         "u1": user1,
#         "u2": user2,
#         "creator": creator_id
#     }).execute()

#     if not res.data:
#         raise RuntimeError("Failed to create or fetch direct chat")

#     return res.data[0]



# def save_message(chat_id: str, sender_id: str, content: str) -> dict:
#     """
#     Persist message to DB
#     """

#     membership = supabase.table("chat_members") \
#         .select("chat_id") \
#         .eq("chat_id", chat_id) \
#         .eq("user_id", sender_id) \
#         .is_("left_at", None) \
#         .execute()

#     if not membership.data:
#         raise PermissionError("User is not a member of this chat")
    
#     res = supabase.table("messages").insert({
#         "chat_id": chat_id,
#         "sender_id": sender_id,
#         "content": content,
#     }).execute()

#     return res.data[0]