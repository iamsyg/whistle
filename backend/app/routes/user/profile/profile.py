# backend/app/routes/user/profile/profile.py

from fastapi import APIRouter, Depends, HTTPException
from app.middlewares.secure_route import verify_jwt_token
from app.controllers.user.profile.get_user_profile import get_user_profile_controller

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("/{user_id}")
def get_user_profile(
    user_id: str, current_user_id: 
    str = Depends(verify_jwt_token),
    ):

    try: 
        return get_user_profile_controller(user_id, current_user_id)
    
    except Exception as e:
        print(f"Error fetching user profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    