# app/controllers/classroom_join_controller.py

from fastapi import HTTPException
from app.utils.supabase_client import supabase
from datetime import datetime, timezone


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
            "role": "member"
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