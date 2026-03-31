# backend/app/routes/user/settings/privacy/privacy.py

from fastapi import APIRouter, Depends, HTTPException
from app.middlewares.secure_route import verify_jwt_token
from app.controllers.user.settings.privacy.get_privacy import get_privacy_settings_controller

router = APIRouter()


@router.get("/privacy")
async def get_privacy_settings(current_user=Depends(verify_jwt_token)):
    try:

        res = get_privacy_settings_controller(current_user)

        return {
            "success": True,
            "data": res["data"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))