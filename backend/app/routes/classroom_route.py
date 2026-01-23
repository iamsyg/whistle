# backend/app/routes/classroom_route.py

import traceback
from fastapi import APIRouter, Depends, Body, HTTPException, Query
from app.controllers.classroom_controller import create_classroom_controller, get_user_all_classrooms_controller
from app.middlewares.secure_route import verify_jwt_token
from app.models.classroom_model import CreateClassroomRequest
from typing import List

router = APIRouter(
    prefix="/classroom",
    tags=["Classroom"]
)

# Create a new classroom
@router.post("/create")
async def create_classroom(
    payload: CreateClassroomRequest,
    creator_id: str = Depends(verify_jwt_token),
):
    try:
        classroom = await create_classroom_controller(
            title=payload.title,
            description=payload.description,
            require_email=payload.require_email,
            allowed_student_chat=payload.allowed_student_chat,
            creator_email=payload.creator_email,
            creator_id=creator_id,
        )

        return classroom

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    

@router.get("/all")
async def get_classrooms(
    user_id: str = Depends(verify_jwt_token),
    selected_email: str = Query(..., description="Currently selected email")
):
    try:

        response = await get_user_all_classrooms_controller(user_id=user_id, selected_email=selected_email)
        print(f"✅ Fetched classrooms for user {user_id}: {response}")
        return {"classrooms": response}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching classrooms: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))