# backend/app/routes/classroom_route.py

import traceback
from fastapi import APIRouter, Depends, Body, HTTPException, Query
from app.controllers.classroom_controller import create_classroom_controller, get_user_all_classrooms_controller
from app.middlewares.secure_route import verify_jwt_token
from typing import List

router = APIRouter(
    prefix="/classroom",
    tags=["Classroom"]
)

# Create a new classroom
@router.post("/create")
async def create_classroom(
    title: str = Body(..., embed=True),
    description: str = Body(None, embed=True),
    required_email: bool = Body(True, embed=True),
    allowed_student_chat: bool = Body(True, embed=True),
    creator_id: str = Depends(verify_jwt_token),
    creator_email: str = Body(..., embed=True)
):
    try:
        classroom_init = await create_classroom_controller(
            title=title,
            creator_id=creator_id,
            creator_email=creator_email,
            description=description,
            required_email=required_email,
            allowed_student_chat=allowed_student_chat
        )

        print(f"✅ Classroom created with ID: {classroom_init}")

        return classroom_init

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creating classroom: {str(e)}")
        print(traceback.format_exc())
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