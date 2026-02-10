# backend/app/controllers/media/upload_media.py

from fastapi import File, HTTPException, UploadFile
from typing import List
from app.utils.supabase_client import supabase

import cloudinary.uploader
import cloudinary.api

# Get user emails

import time
import os

def sanitize_filename(name: str) -> str:
    name = os.path.splitext(name)[0]
    name = name.lower().replace(" ", "_")
    return "".join(c for c in name if c.isalnum() or c in "_-")[:40]



def upload_media_controller(
        sender_id: str,
        conversation_type: str,
        chat_id: str,
        file: UploadFile = File(...),
    ):

    try:

        content_type = file.content_type or ""

        filename_base = sanitize_filename(file.filename)
        timestamp = int(time.time())

        public_id = f"{filename_base}-{timestamp}"

        if content_type.startswith("image/"):
            file_type = "images"
        elif content_type.startswith("video/"):
            file_type = "videos"
        else:
            file_type = "documents"

        folder = (
            f"whistle/{sender_id}/{file_type}/{conversation_type}/{chat_id}"
        )

        # Upload the file to Cloudinary
        result = cloudinary.uploader.upload(
            file.file,
            folder=folder,
            public_id=public_id,
            resource_type="auto",
            overwrite=False,
        )

        msg_res = (
            supabase
            .rpc(
                "send_message_rpc",
                {
                    "p_chat_id": chat_id,
                    "p_sender_id": sender_id,
                    "p_content": result["secure_url"],
                    "p_message_type": file_type[:-1],  # images → image
                    "p_metadata": {
                        "cloudinary": {
                            "public_id": result["public_id"],
                            "resource_type": result["resource_type"],
                            "bytes": result["bytes"],
                            "format": result.get("format"),
                            "width": result.get("width"),
                            "height": result.get("height"),
                            "duration": result.get("duration"),
                        },
                        "original_name": file.filename,
                    }
                }
            )
            .execute()
        )


        print(f"send_chat_messages - RPC response: {msg_res}")

        if not msg_res.data:
            raise HTTPException(500, "Failed to send message")

        rpc_msg = msg_res.data[0]

        print(f"send_chat_messages - RPC message data: {rpc_msg}")

        message = {
            "id": rpc_msg["id"],
            "chat_id": rpc_msg["chat_id"],
            "sender_id": rpc_msg["sender_id"],

            "content": rpc_msg["content"],
            "message_type": rpc_msg.get("message_type", "text"),
            "metadata": {
                **rpc_msg.get("metadata", {}),
                "upload_preview": {
                    "secure_url": result["secure_url"]
                }
            },
            "reply_to_id": rpc_msg.get("reply_to_id"),

            "created_at": rpc_msg["created_at"],
            "edited_at": None,
            "deleted_at": None,

            # "sender": {
            #     "id": rpc_msg["sender"]["id"],

            #     "role": rpc_msg["sender"].get("role"),
            #     "join_via": rpc_msg["sender"].get("join_via"),

            #     "name": rpc_msg["sender"].get("name"),
            #     "avatar_url": rpc_msg["sender"].get("avatar_url"),

            #     "phone_number": rpc_msg["sender"].get("phone_number"),
            #     "username": rpc_msg["sender"].get("username"),

            #     "email": rpc_msg["sender"].get("email"),
            #     "google_name": rpc_msg["sender"].get("google_name"),
            #     "google_avatar": rpc_msg["sender"].get("google_avatar"),
            # },
            "sender": rpc_msg.get("sender"),   # 🔥 THIS IS THE KEY
        }

        return message

    except HTTPException:
        raise

    except Exception as e:
        print(f"Error uploading media: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to upload media"
        )

    