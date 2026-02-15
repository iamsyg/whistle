# backend/app/controllers/classroom/fetch_classroom_profile/fetch_non_email_classroom_profile.py

from fastapi import HTTPException
from app.utils.supabase_client import supabase


async def fetch_non_email_classroom_profile_controller(
    classroom_chat_id: str,
    current_user_id: str,
    page: int = 1,
    limit: int = 20
):
    try:
        if page < 1:
            page = 1
        if limit < 1 or limit > 100:
            limit = 20

        offset = (page - 1) * limit

        # Validate membership + role
        membership_res = (
            supabase
            .table("chat_members")
            .select("role")
            .eq("chat_id", classroom_chat_id)
            .eq("user_id", current_user_id)
            .is_("left_at", None)
            .maybe_single()
            .execute()
        )

        if not membership_res.data:
            raise HTTPException(status_code=403, detail="Not a member of this classroom")

        is_admin = membership_res.data["role"] == "admin"

        # Fetch classroom + chat metadata
        classroom_res = (
            supabase
            .table("classrooms")
            .select("""
                chat_id,
                class_code,
                invite_link,
                allow_student_chat,
                require_email,
                created_at,
                chat:chat_id (
                    id,
                    title,
                    description,
                    created_at,
                    type
                )
            """)
            .eq("chat_id", classroom_chat_id)
            .single()
            .execute()
        )

        if not classroom_res.data:
            raise HTTPException(status_code=404, detail="Classroom not found")

        classroom = classroom_res.data

        if classroom["chat"]["type"] != "classroom":
            raise HTTPException(status_code=400, detail="Invalid classroom chat")

        # Fetch members (admin first, stable ordering)
        members_res = (
            supabase
            .table("chat_members")
            .select("""
                user_id,
                role,
                joined_at,
                join_via,
                profile:user_id (
                    name,
                    avatar_url,
                    phone_number,
                    username
                )
            """, count="exact")
            .eq("chat_id", classroom_chat_id)
            .is_("left_at", None)
            .order("role", desc=True)        # admin first
            .order("joined_at", desc=False)
            .order("user_id", desc=False)    # stable order
            .range(offset, offset + limit - 1)
            .execute()
        )

        total_members = members_res.count or 0

        members = []

        for m in members_res.data or []:
            profile = m.get("profile") or {}
            join_via = m.get("join_via")

            members.append({
                "user_id": m["user_id"],
                "role": m["role"],
                "joined_at": m["joined_at"],
                "email": None,
                "google_name": None,
                "google_avatar": None,
                "name": profile.get("name"),
                "avatar_url": profile.get("avatar_url"),

                "phone_number": (
                    profile.get("phone_number")
                    if join_via == "phone"
                    else None
                ),

                "username": (
                    profile.get("username")
                    if join_via == "username"
                    else None
                ),
            })

        # Base response (visible to all members)
        response = {
            "chat_id": classroom["chat"]["id"],
            "title": classroom["chat"]["title"],
            "description": classroom["chat"]["description"],
            "created_at": classroom["chat"]["created_at"],
            "is_admin": is_admin,
            "members": members,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_members,
                "has_more": offset + limit < total_members
            },
            "admin_fields": None,  # to be filled if is_admin
            "meta": None
        }

        # Admin-only fields
        if is_admin:
            response["admin_fields"] = {
                "invite_link": classroom["invite_link"],
                "class_code": classroom["class_code"],
                "allowed_domains": None,
                "allow_student_chat": classroom["allow_student_chat"],
                "require_email": classroom["require_email"],
                "join_method": "email" if classroom["require_email"] else "non-email"
            }

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
