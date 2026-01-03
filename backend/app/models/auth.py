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
    country_code: str
    user_id: str
    phone_verified: bool  # ✅ All fields needed for insert