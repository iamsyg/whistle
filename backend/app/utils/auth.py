# app/utils/auth.py
import jwt
from fastapi import HTTPException, status
from app.models.config import settings

def verify_jwt_token(token: str) -> str:
    """Verify JWT and return user_id"""
    try:
        # Use your Supabase JWT secret
        payload = jwt.decode(
            token, 
            settings.SUPABASE_JWT_SECRET, 
            algorithms=["HS256"],
            audience="authenticated"
        )
        return payload.get("sub")  # user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
