# backend/app/routes/auth.py

from fastapi import APIRouter
from controllers.auth import check_phone_number

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

@router.get("/check-phone-number/")
def check_phone_number(phone: str):
    exists = check_phone_number(phone)
    return {
        "exists": exists,
        "message": "Phone number already registered" if exists else "Phone not registered"
    }