from fastapi import APIRouter, HTTPException
from app.controllers.auth_controller import check_phone_hash, insert_phone_hash_and_user_id
from app.models.auth import CheckPhoneRequest, InsertPhoneRequest

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

@router.post("/check-phone")
def check_phone(payload: CheckPhoneRequest):
    """Check if phone hash exists - only needs phone_hash"""
    try:
        exists = check_phone_hash(payload.phone_hash)
        return {"exists": exists}
    
    except Exception as e:
        print(f"Error in check_phone: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/insert-phone")
def insert_phone(payload: InsertPhoneRequest):
    """Insert new phone - needs phone_hash, user_id, and phone_verified"""
    try:
        data = insert_phone_hash_and_user_id(
            payload.phone_hash,
            payload.country_code,
            payload.user_id,
            payload.phone_verified,
        )
        return {"data": data}
    except ValueError as e:
        print(f"Validation error: {str(e)}")
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        print(f"Error in insert_phone: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))