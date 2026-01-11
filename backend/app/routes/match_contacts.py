# #  backend/app/routes/match_contacts.py

from fastapi import APIRouter, HTTPException, status
from app.models.match_contacts import MatchContactsRequest
from app.controllers.contact_controller import match_contacts

router = APIRouter(
    prefix="/contacts",
    tags=["Contacts"]
)

@router.post("/match-contacts")
async def match_contacts_endpoint(payload: MatchContactsRequest):
    """
    Match contact phone hashes against registered users.
    
    Args:
        payload: Contains list of phone_hashes (SHA256 hashed phone numbers in E.164 format)
        
    Returns:
        Dict with matched_contacts list and count
    """
    try:
        # Handle empty list gracefully
        if not payload.phone_hashes:
            return {
                "matched_contacts": [],
                "count": 0
            }
        
        matched = match_contacts(payload.phone_hashes)
        
        return {
            "matched_contacts": matched,
            "count": len(matched)
        }
        
    except ValueError as e:
        print(f"Validation error in match_contacts: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        print(f"Error in match_contacts endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to match contacts"
        )
