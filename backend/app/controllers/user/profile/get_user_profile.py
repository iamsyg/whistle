# backend/app/controllers/user/profile/user_profile.py

from fastapi import HTTPException
from app.utils.supabase_client import supabase

def get_user_profile_controller(user_id: str, current_user_id: str):
    try:
        # 1. Fetch profile
        profile_res = (
            supabase.table("profile")
            .select("""
                id,
                name,
                username,
                avatar_url,
                phone_number,
                about,
                profile_links,
                emails (
                    email,
                    verified,
                    google_name
                )
            """)
            .eq("id", user_id)
            .single()
            .execute()
        )

        if not profile_res.data:
            raise HTTPException(status_code=404, detail="User not found")

        profile = profile_res.data

        emails = profile.get("emails", [])
        
        return {
            "id": profile["id"],
            "name": profile["name"],
            "username": profile["username"],
            "avatar_url": profile["avatar_url"],
            "phone_number": profile["phone_number"],
            "about": profile["about"],
            "profile_links": profile.get("profile_links") or [],
            "primary_email": emails[0] if emails else None,
            "emails": emails
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching profile: {str(e)}"
        )