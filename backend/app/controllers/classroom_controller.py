# backend/app/controllers/classroom_controller.py

from fastapi import HTTPException
from app.utils.supabase_client import supabase
from typing import List, Optional
import secrets
import string
from datetime import datetime, timezone

ALPHABET = string.ascii_uppercase + string.digits

def generate_class_code(length=7):
    return "".join(secrets.choice(ALPHABET) for _ in range(length))

def generate_invite_link():
    return secrets.token_urlsafe(16)




# Controller to create a new classroom

async def create_classroom_controller(
    title: str,
    creator_id: str,
    creator_email: str,
    description: str | None,
    require_email: bool,
    allow_student_chat: bool,
):
    # 1️⃣ Resolve email → UUID + google_name
    email_res = (
        supabase
        .table("emails")
        .select("id, google_name")
        .eq("email", creator_email)
        .eq("user_id", creator_id)
        .eq("verified", True)
        .limit(1)
        .execute()
    )

    if not email_res.data:
        raise HTTPException(400, "Invalid or unverified email")

    email_row = email_res.data[0]
    email_id = email_row["id"]
    google_name = email_row["google_name"]

    # 2️⃣ Create classroom chat
    chat_res = (
        supabase
        .table("chat")
        .insert({
            "type": "classroom",
            "title": title.strip(),
            "description": description,
            "created_by": creator_id,
        })
        .execute()
    )

    if not chat_res.data:
        raise HTTPException(500, "Failed to create chat")

    chat = chat_res.data[0]

    # 3️⃣ Create classroom metadata
    supabase.table("classrooms").insert({
        "chat_id": chat["id"],
        "email_id": email_id,
        "class_code": generate_class_code(),
        "invite_link": generate_invite_link(),
        "require_email": require_email,
        "allow_student_chat": allow_student_chat,
    }).execute()

    # 4️⃣ Add creator as admin
    supabase.table("chat_members").insert({
        "chat_id": chat["id"],
        "user_id": creator_id,
        "role": "admin",
        "email_id": email_id,
    }).execute()

    # 5️⃣ Return full ClassroomProfile-compatible object
    return {
        "chat_id": chat["id"],
        "title": chat["title"],
        "description": chat.get("description"),
        "created_at": chat["created_at"],
        "creator": {
            "id": creator_id,
            "name": google_name or "Unknown",
            "avatar_url": None,
            "email": creator_email,
            "google_name": google_name,
        },
        "allowed_domains": None,
        "allow_student_chat": allow_student_chat,
        "require_email": require_email,
        "is_admin": True,
    }


async def join_classroom_by_code_controller(
    user_id: str,
    class_code: str,
    join_via: str,          # "email" | "phone" | "username"
    selected_email: str | None = None
):
    # 1️⃣ Fetch classroom + chat
    classroom_res = (
        supabase
        .from_("classrooms")
        .select("""
            chat_id,
            require_email,
            allowed_domains,
            chat:chat_id (
                id,
                title
            )
        """)
        .eq("class_code", class_code)
        .limit(1)
        .execute()
    )

    if not classroom_res.data:
        raise HTTPException(404, "Invalid classroom code")

    classroom = classroom_res.data[0]
    chat_id = classroom["chat_id"]

    # 2️⃣ Already a member → redirect
    member_check = (
        supabase
        .table("chat_members")
        .select("chat_id")
        .eq("chat_id", chat_id)
        .eq("user_id", user_id)
        .is_("left_at", None)
        .limit(1)
        .execute()
    )

    if member_check.data:
        return {
            "status": "already_joined",
            "chat_id": chat_id
        }

    # ------------------------------------------------
    # 3️⃣ EMAIL FLOW (require_email = true)
    # ------------------------------------------------
    if classroom["require_email"]:

        if join_via != "email":
            raise HTTPException(400, "This classroom requires email")

        if not selected_email:
            raise HTTPException(400, "Email required")

        # Validate email
        email_res = (
            supabase
            .table("emails")
            .select("id, email")
            .eq("user_id", user_id)
            .eq("email", selected_email)
            .eq("verified", True)
            .limit(1)
            .execute()
        )

        if not email_res.data:
            raise HTTPException(400, "Invalid or unverified email")

        # Domain check
        allowed_domains = classroom["allowed_domains"]
        domain = selected_email.split("@")[-1].lower()

        if allowed_domains and domain not in allowed_domains:
            raise HTTPException(403, "Email domain not allowed")

        # Auto-join
        supabase.table("chat_members").insert({
            "chat_id": chat_id,
            "user_id": user_id,
            "role": "member",
            "email_id": email_res.data[0]["id"],
        }).execute()

        return {
            "status": "joined",
            "chat_id": chat_id,
            "user_id": user_id,
            "message": "Successfully joined the classroom"
        }

    # ------------------------------------------------
    # 4️⃣ PHONE / USERNAME FLOW (require_email = false)
    # ------------------------------------------------
    if join_via == "email":
        raise HTTPException(400, "Email join is disabled for this classroom")

    if join_via not in ("phone", "username"):
        raise HTTPException(400, "Invalid join method")

    # Validate identity
    profile = (
        supabase
        .table("profile")
        .select("phone_verified, username")
        .eq("id", user_id)
        .single()
        .execute()
    )

    if not profile.data:
        raise HTTPException(404, "Profile not found")

    if join_via == "phone" and not profile.data["phone_verified"]:
        raise HTTPException(400, "Phone number not verified")

    if join_via == "username" and not profile.data["username"]:
        raise HTTPException(400, "Username not set")
    
    existing_request = (
    supabase
    .table("classroom_join_requests")
    .select("id")
    .eq("chat_id", chat_id)
    .eq("user_id", user_id)
    .eq("status", "pending")
    .limit(1)
    .execute()
    )

    if existing_request.data:
        return {
            "status": "pending",
            "chat_id": chat_id,
            "user_id": user_id,
            "message": "Join request already pending"
        }

    # Create join request
    existing_req = (
        supabase
        .table("classroom_join_requests")
        .select("id, status")
        .eq("chat_id", chat_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )

    if existing_req.data:
        status = existing_req.data[0]["status"]

        if status == "pending":
            raise HTTPException(400, "Join request already pending")

        if status == "approved":
            raise HTTPException(400, "User already approved")

        # 🔁 Rejected → resend request
        supabase.table("classroom_join_requests").update({
            "status": "pending",
            "join_via": join_via,
            "requested_at": datetime.now(timezone.utc).isoformat(),
            "decided_at": None,
            "decided_by": None
        }).eq("chat_id", chat_id).eq("user_id", user_id).execute()

    else:
        supabase.table("classroom_join_requests").insert({
            "chat_id": chat_id,
            "user_id": user_id,
            "join_via": join_via
        }).execute()

    return {
        "status": "pending",
        "chat_id": chat_id,
        "user_id": user_id,
        "message": "Join request sent for admin approval"
    }



async def approve_join_request_controller(
    admin_id: str,
    request_id: str
):
    # Fetch request
    req = (
        supabase
        .table("classroom_join_requests")
        .select("chat_id, user_id, status")
        .eq("id", request_id)
        .single()
        .execute()
    )

    if not req.data or req.data["status"] != "pending":
        raise HTTPException(400, "Invalid request")

    chat_id = req.data["chat_id"]
    user_id = req.data["user_id"]

    # Ensure admin
    admin_check = (
        supabase
        .table("chat_members")
        .select("role")
        .eq("chat_id", chat_id)
        .eq("user_id", admin_id)
        .eq("role", "admin")
        .is_("left_at", None)
        .limit(1)
        .execute()
    )

    if not admin_check.data:
        raise HTTPException(403, "Not authorized")

    # Approve
    supabase.table("classroom_join_requests").update({
        "status": "approved",
        "decided_at": datetime.now(timezone.utc).isoformat(),
        "decided_by": admin_id
    }).eq("id", request_id).eq("status", "pending").execute()

    supabase.table("chat_members").insert({
        "chat_id": chat_id,
        "user_id": user_id,
        "role": "member"
    }).execute()

    return {
        "status": "approved",
        "chat_id": chat_id,
        "user_id": user_id,
        "message": "User has been added to the classroom"
    }



async def reject_join_request_controller(admin_id: str, request_id: str):

    # 1️⃣ Fetch request
    req = (
        supabase
        .table("classroom_join_requests")
        .select("chat_id, user_id, status")
        .eq("id", request_id)
        .single()
        .execute()
    )

    if not req.data or req.data["status"] != "pending":
        raise HTTPException(400, "Invalid request")

    chat_id = req.data["chat_id"]
    user_id = req.data["user_id"]

    # 2️⃣ Ensure admin
    admin_check = (
        supabase
        .table("chat_members")
        .select("role")
        .eq("chat_id", chat_id)
        .eq("user_id", admin_id)
        .eq("role", "admin")
        .is_("left_at", None)
        .limit(1)
        .execute()
    )

    if not admin_check.data:
        raise HTTPException(403, "Not authorized")

    # 3️⃣ Reject safely
    supabase.table("classroom_join_requests").update({
        "status": "rejected",
        "decided_at": datetime.now(timezone.utc).isoformat(),
        "decided_by": admin_id
    }).eq("id", request_id).eq("status", "pending").execute()

    return {
        "status": "rejected",
        "chat_id": chat_id,
        "user_id": user_id,
        "message": "Join request has been rejected"
    }


async def fetch_join_requests_controller(admin_id: str, chat_id: str):
    # 1️⃣ Ensure admin
    admin_check = (
        supabase
        .table("chat_members")
        .select("role")
        .eq("chat_id", chat_id)
        .eq("user_id", admin_id)
        .eq("role", "admin")
        .is_("left_at", None)
        .limit(1)
        .execute()
    )

    if not admin_check.data:
        raise HTTPException(403, "Not authorized")

    # 2️⃣ Fetch pending requests
    res = (
        supabase
        .table("classroom_join_requests")
        .select(
            "id,user_id,join_via,requested_at,status,"
            "profile:user_id(id,name,username,phone_number,avatar_url)"
        )
        .eq("chat_id", chat_id)
        .eq("status", "pending")
        .order("requested_at", desc=True)
        .execute()
    )

    requests = []

    for r in res.data or []:
        profile = r.get("profile") or {}

        identity = (
            profile.get("username")
            if r["join_via"] == "username"
            else profile.get("phone_number")
        )

        requests.append({
            "id": r["id"],
            "user_id": r["user_id"],
            "join_via": r["join_via"],
            "requested_at": r["requested_at"],
            "status": r["status"],
            "name": profile.get("name"),
            "avatar_url": profile.get("avatar_url"),
            "display_identity": identity,
        })

    return {
        "chat_id": chat_id,
        "count": len(requests),
        "requests": requests,
    }
