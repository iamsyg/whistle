# backend/app/routes/auth.py

from fastapi import APIRouter, HTTPException

from app.controllers.auth import check_phone_number, insert_phone_number_and_userId
from app.models.auth import Auth

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

@router.get("/check-phone-number")
def check_phone_number_endpoint(phone: str):

    """
    Check if phone number exists in database
    """

    try:
        print(f"Checking phone number: {phone}")
        exists = check_phone_number(phone)
        print(f"Phone exists: {exists}")
        return {"exists": exists}
    
    except Exception as e:
        print(f"Error in check_phone_number_endpoint: {str(e)}")
        raise HTTPException(500, detail=str(e))


@router.post("/insert-phone-number")
def insert_phone_number_and_user_id_endpoint(payload: Auth):

    """
    Insert new phone number and user_id into database
    """

    try:
        print(f"Inserting phone: {payload.phone_number}, user_id: {payload.user_id} phone_verified: {payload.phone_verified}")
        
        data = insert_phone_number_and_userId(payload.phone_number, payload.user_id, payload.phone_verified)
        print(f"Insert successful: {data}")

        return {
            "data": data,
            "message": "Phone number inserted successfully",
        }
    
    except ValueError as e:
        print(f"Validation error: {str(e)}")
        raise HTTPException(409, detail=str(e))
    
    except Exception as e:
        print(f"Error in insert_phone_number_endpoint: {str(e)}")
        raise HTTPException(500, detail=str(e))