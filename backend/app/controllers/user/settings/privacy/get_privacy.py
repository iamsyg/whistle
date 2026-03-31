# backend/app/controllers/user/settings/privacy/get_privacy.py

from fastapi import APIRouter, Depends, HTTPException
from app.utils.supabase_client import supabase

router = APIRouter()

def get_privacy_settings_controller(current_user):
    try:
        user_id = current_user

        # Fetch only required fields
        res = (
            supabase.table("profile")
            .select("""
                phone_visibility,
                last_seen_visibility,
                profile_photo_visibility,
                about_visibility,
                status_visibility,
                read_receipts_enabled,
                block_unknown_messages
            """)
            .eq("id", user_id)
            .single()
            .execute()
        )

        if not res.data:
            raise HTTPException(status_code=404, detail="Profile not found")

        return {
            "success": True,
            "data": res.data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
