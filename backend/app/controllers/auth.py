# backend/app/controllers/auth.py

from utils.supabase_client import supabase

def check_phone_number(phone_number: str) -> bool:
    response = (
        supabase
        .table("profile")
        .select("id")
        .eq("phone_number", phone_number)
        .limit(1)
        .execute()
    )

    return bool(response.data)