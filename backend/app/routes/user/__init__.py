# backend/app/routes/user/__init__.py

from datetime import datetime
import traceback
from fastapi import APIRouter, Depends, Body, HTTPException, Query
from typing import Literal, Optional, List

from app.routes.user.profile.profile import router as profile_router


router = APIRouter(prefix="/user", tags=["User"])

router.include_router(profile_router)