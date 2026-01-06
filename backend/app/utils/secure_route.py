# app/middlewares/secure_route.py

from fastapi import Header, HTTPException, status
from app.utils.supabase_client import supabase

async def verify_jwt_token(
    authorization: str = Header(...)
) -> str:
    """
    Verify Supabase JWT and return user_id
    """

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )

    token = authorization.split(" ")[1]

    user_res = supabase.auth.get_user(token)

    if user_res.user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    return user_res.user.id  # ← VERIFIED user_id
