# backend/app/controllers/auth.py

from app.utils.supabase_client import supabase
from postgrest.exceptions import APIError

def check_phone_number(phone_number: str) -> bool:
    """
    Check if a phone number exists in the profile table
    """
    phone_number = phone_number.strip()

    try:
        response = (
            supabase
            .table("profile")
            .select("id")
            .eq("phone_number", phone_number)
            .limit(1)
            .execute()
        )

        # The new Supabase client doesn't have .error attribute
        # If there's an error, it raises an exception
        # Check if we got any data back
        return bool(response.data and len(response.data) > 0)
    
    except Exception as e:
        print(f"Error checking phone number: {str(e)}")
        raise Exception(f"Database error while checking phone number: {str(e)}")


def insert_phone_number_and_userId(phone_number: str, user_id: str, phone_verified: bool) -> dict:

    """
    Insert a new phone number and user_id into the profile table
    """

    phone_number = phone_number.strip()
    user_id = user_id.strip()

    try:
        # Validate phone format
        if "-" not in phone_number:
            raise ValueError("Invalid phone format. Expected format: COUNTRYCODE-NUMBER (e.g., 91-831)")
        
        # Insert into database
        response = (
            supabase
            .table("profile")
            .insert({"phone_number": phone_number, "id": user_id, "phone_verified": phone_verified})
            .execute()
        )
        
        # Return the inserted data
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