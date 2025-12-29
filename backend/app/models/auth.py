# backend/app/models/auth.py

from pydantic import BaseModel

class Auth(BaseModel):
    phone_number: str
    user_id: str 
    phone_verified: bool