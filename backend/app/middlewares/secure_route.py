# app/middlewares/secure_route.py

import traceback
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

    try:
        user_res = supabase.auth.get_user(token)

        if user_res.user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )
        
        user_id = user_res.user.id

        # ✅ Step 2: Verify profile exists (IMPORTANT)
        profile_res = (
            supabase.table("profile")
            .select("id")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )

        if not profile_res.data:
            raise HTTPException(
                status_code=401,
                detail="User profile not found"
            )

        # return user_res.user.id
        return user_id
    
    except Exception as e:
        print(f"❌ Token verification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )


def verify_jwt_token_ws(token: str) -> str:
    """
    Verify JWT token for WebSocket connections using Supabase
    Returns user_id if valid, raises exception if invalid
    """
    try:
        if not token:
            print("❌ No token provided to verify_jwt_token_ws")
            raise Exception("No token provided")
        
        print(f"🔐 Verifying WebSocket token (first 50 chars): {token[:50]}...")
        
        # ✅ Use Supabase client to verify
        user_res = supabase.auth.get_user(token)
        
        print(f"📊 Supabase response: {user_res}")
        
        if not user_res or not user_res.user:
            print(f"❌ Invalid token - no user found in response")
            raise Exception("Invalid or expired token")
        
        user_id = user_res.user.id

        profile_res = (
            supabase.table("profile")
            .select("id")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )

        if not profile_res.data:
            raise Exception("User profile not found")
        
        print(f"✅ Token verified successfully for user: {user_id}")
        
        return user_id
        
    except Exception as e:
        print(f"❌ WebSocket token verification failed: {str(e)}")
        print(f"❌ Exception type: {type(e).__name__}")
        print(traceback.format_exc())
        raise Exception(f"Token verification failed: {str(e)}")