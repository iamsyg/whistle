# backend/app/controllers/classroom/fetch_classroom_profile/fetch_email_classroom_profile.py

from fastapi import HTTPException
from app.utils.supabase_client import supabase


async def fetch_email_classroom_profile_controller(
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

        # Check Membership + Role

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
                allowed_domains,
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

        # Fetch paginated members (sorted: admin first)

        members_res = (
            supabase
            .table("chat_members")
            .select("""
                user_id,
                role,
                joined_at,
                email:email_id (
                    email,
                    google_name,
                    google_avatar
                )
            """, count="exact")
            .eq("chat_id", classroom_chat_id)
            .is_("left_at", None)
            .order("role", desc=True)   # admin first
            .order("joined_at", desc=False)
            .order("user_id", desc=False)
            .range(offset, offset + limit - 1)
            .execute()
        )

        total_members = members_res.count or 0

        members = []
        for m in members_res.data:
            email_data = m.get("email")
            members.append({
                "user_id": m["user_id"],
                "role": m["role"],
                "joined_at": m["joined_at"],
                "email": email_data["email"] if email_data else None,
                "google_name": email_data["google_name"] if email_data else None,
                "google_avatar": email_data["google_avatar"] if email_data else None,
            })

        # Build response (admin fields conditionally included)
   
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
            }
        }

        # Admin only fields
        if is_admin:
            response.update({
                "invite_link": classroom["invite_link"],
                "class_code": classroom["class_code"],
                "allowed_domains": classroom["allowed_domains"],
                "allow_student_chat": classroom["allow_student_chat"],
                "require_email": classroom["require_email"],
                "join_method": "email" if classroom["require_email"] else "non-email"
            })

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


    
