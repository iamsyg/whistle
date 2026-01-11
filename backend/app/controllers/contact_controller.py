# backend/app/controllers/contact_controller.py

from app.utils.supabase_client import supabase
from postgrest.exceptions import APIError

MAX_CONTACT_HASHES = 5000

def match_contacts(phone_hashes: list[str]) -> list[dict]:
    """
    Match phone hashes against registered users in the database.
    
    Args:
        phone_hashes: List of SHA256 hashed phone numbers
        
    Returns:
        List of matched user profiles with phone_number_hash included
    """
    if not phone_hashes:
        return []
    
    if len(phone_hashes) > MAX_CONTACT_HASHES:
        raise ValueError(f"Too many contact hashes. Maximum is {MAX_CONTACT_HASHES}")
    
    try:
        # Call the Postgres RPC function
        res = supabase.rpc(
            "match_contacts",
            {"hashes": phone_hashes}
        ).execute()
        
        # The RPC returns: id, name, username, avatar_url
        # We need to add phone_number_hash back for frontend matching
        matched_data = res.data or []
        
        # Query to get phone_number_hash for matched users
        if matched_data:
            matched_ids = [user['id'] for user in matched_data]
            
            # Get phone hashes for matched users
            hash_res = supabase.table("profile").select("id, phone_number_hash").in_("id", matched_ids).execute()
            
            # Create a mapping of id -> phone_number_hash
            hash_map = {row['id']: row['phone_number_hash'] for row in hash_res.data}
            
            # Add phone_number_hash to each matched contact
            for user in matched_data:
                user['phone_number_hash'] = hash_map.get(user['id'])
        
        print(f"Matched {len(matched_data)} contacts from {len(phone_hashes)} hashes")
        
        return matched_data
        
    except APIError as e:
        print(f"Supabase RPC error: {e}")
        raise Exception("Failed to match contacts") from e
    except Exception as e:
        print(f"Unknown match_contacts error: {e}")
        raise