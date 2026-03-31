# # backend/app/routes/user/settings/__init__.py

from fastapi import APIRouter
from app.routes.user.settings.privacy.privacy import router as privacy_router


router = APIRouter(prefix="/settings", tags=["Settings"])

router.include_router(privacy_router)