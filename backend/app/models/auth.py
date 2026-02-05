# backend/app/models/auth.py

from pydantic import BaseModel

# class Auth(BaseModel):
#     phone_hash: str
#     user_id: str 
#     phone_verified: bool


class CheckPhoneRequest(BaseModel):
    phone_hash: str  # ✅ Only this field needed

class InsertPhoneRequest(BaseModel):
    phone_hash: str
    phone_number: str
    country_code: str
    user_id: str
    phone_verified: bool  # ✅ All fields needed for insert

class InsertEmailRequest(BaseModel):
    email: str
    google_name: str
    email_verified: bool
    google_avatar: str 