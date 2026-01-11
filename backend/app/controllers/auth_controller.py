# backend/app/controllers/auth.py

from app.utils.supabase_client import supabase
from postgrest.exceptions import APIError

def check_phone_hash(phone_hash: str) -> bool:

    phone_hash = phone_hash.strip()

    try:
        response = (
            supabase
            .table("profile")
            .select("id")
            .eq("phone_number_hash", phone_hash)
            .limit(1)
            .execute()
        )
        return bool(response.data)
    
    except Exception as e:
        print(f"Error checking phone number: {str(e)}")
        raise Exception(f"Database error while checking phone number: {str(e)}")


def insert_phone_hash_and_user_id(
    phone_hash: str,
    country_code: str,
    user_id: str,
    phone_verified: bool
) -> dict:
    
    phone_hash = phone_hash.strip()
    country_code = country_code.strip()
    user_id = user_id.strip()
    
    try:
        response = (
            supabase
            .table("profile")
            .insert({
                "id": user_id,
                "phone_number_hash": phone_hash,
                "country_code": country_code,
                "phone_verified": phone_verified,
            })
            .execute()
        )

        return response.data
    

    except APIError as e:
        # Handle duplicate key error
        if "duplicate key value" in str(e).lower() or "unique" in str(e).lower():
            raise ValueError("Phone number already exists")
        
        print(f"API Error inserting phone number: {str(e)}")

        raise ValueError(f"Failed to insert phone number: {str(e)}")
    
    except ValueError as e:
        # Re-raise validation errors
        raise e
    
    except Exception as e:
        print(f"Unexpected error inserting phone number: {str(e)}")
        raise Exception(f"Database error: {str(e)}")