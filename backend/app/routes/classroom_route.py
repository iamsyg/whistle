# backend/app/routes/classroom_route.py

import traceback
from fastapi import APIRouter, Depends, Body, HTTPException, Query

from app.controllers.classroom_controller import create_classroom_controller, join_classroom_by_code_controller, approve_join_request_controller, reject_join_request_controller, fetch_join_requests_controller

from app.controllers.classroom.fetch_classrooms.fetch_email_classrooms import fetch_email_classrooms_controller

from app.controllers.classroom.fetch_classrooms.fetch_non_email_classrooms import fetch_non_email_classrooms_controller

from app.controllers.classroom.fetch_classroom_profile.fetch_email_classroom_profile import fetch_email_classroom_profile_controller

from app.controllers.classroom.fetch_members.fetch_email_classroom_members import fetch_email_classroom_members_controller

from app.controllers.classroom.fetch_members.fetch_non_email_classroom_members import fetch_non_email_classroom_members_controller

from app.middlewares.secure_route import verify_jwt_token
from app.models.classroom_model import CreateClassroomRequest, JoinClassroomRequest

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

        print(f"✅ Creating classroom with payload: {payload}")
        print(f"allow_student_chat: {payload.allow_student_chat}")

        classroom = await create_classroom_controller(
            title=payload.title,
            description=payload.description,
            require_email=payload.require_email,
            allow_student_chat=payload.allow_student_chat,
            creator_email=payload.creator_email,
            creator_id=creator_id,
        )

        return classroom

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/all/email")
async def get_email_classrooms(
    user_id: str = Depends(verify_jwt_token),
    selected_email: str = Query(..., description="Currently selected email")
):
    try:

        # response = await fetch_email_classrooms_controller(user_id=user_id, selected_email=selected_email)
        # print(f"✅ Fetched classrooms for user {user_id}: {response}")
        # return {"classrooms": response}

        classrooms = await fetch_email_classrooms_controller(
            user_id=user_id,
            selected_email=selected_email
        )

        return classrooms
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching classrooms: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/all/non-email")
async def fetch_non_email_classrooms(
    user_id: str = Depends(verify_jwt_token),
):
    try:

        classrooms = await fetch_non_email_classrooms_controller(
            user_id=user_id
        )

        return classrooms
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching non-email classrooms: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/profile/email")
async def fetch_email_classroom_profile(
    classroom_chat_id: str = Query(..., description="Classroom chat ID to fetch profile for"),
    current_user_id: str = Depends(verify_jwt_token),
    page: int = Query(1, description="Page number for members pagination"),
    limit: int = Query(20, description="Number of members per page")
):
    try:

        print(f"✅ Fetching email classroom profile for classroom {classroom_chat_id} and user {current_user_id} with page {page} and limit {limit}")
        
        response = await fetch_email_classroom_profile_controller(
            classroom_chat_id=classroom_chat_id,
            current_user_id=current_user_id,
            page=page,
            limit=limit
        )

        print(f"✅ Fetched email classroom profile: {response}")
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching email classroom profile: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
    

@router.post("/code/join")
async def join_classroom_by_code(
     payload: JoinClassroomRequest,
    user_id: str = Depends(verify_jwt_token),
):
    try:

        print(f"✅ User {user_id} attempting to join classroom with code: {payload.class_code} via {payload.join_via}")
        response = await join_classroom_by_code_controller(
            user_id=user_id,
            class_code=payload.class_code,
            join_via=payload.join_via,
            selected_email=payload.selected_email
        )

        print(f"✅ Join classroom response: {response}")
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error joining classroom: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
    


@router.post(f"/join-requests/approve")
async def approve_join_request(
    admin_id: str = Depends(verify_jwt_token),
    request_id: str = Query(..., description="Join request ID to approve")
):
    try:

        print(f"✅ Admin {admin_id} approving join request {request_id}")

        response = await approve_join_request_controller(
            admin_id=admin_id,
            request_id=request_id
        )

        print(f"✅ Approve join request response: {response}")
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error approving join request: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
    

@router.post(f"/join-requests/reject")
async def reject_join_request(
    admin_id: str = Depends(verify_jwt_token),
    request_id: str = Query(..., description="Join request ID to reject")
):
    try:

        print(f"✅ Admin {admin_id} rejecting join request {request_id}")

        response = await reject_join_request_controller(
            admin_id=admin_id,
            request_id=request_id
        )

        print(f"✅ Reject join request response: {response}")
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error rejecting join request: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


   
@router.get("/join-requests/pending")
async def fetch_join_requests(
    admin_id: str = Depends(verify_jwt_token),
    chat_id: str = Query(..., description="Classroom chat ID to fetch join requests for")
):
    try:

        print(f"✅ Admin {admin_id} fetching pending join requests for classroom {chat_id}")

        response = await fetch_join_requests_controller(
            admin_id=admin_id,
            chat_id=chat_id
        )

        print(f"✅ Pending join requests response: {response}")
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching pending join requests: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/members/email")
async def fetch_email_classroom_members(
    classroom_chat_id: str = Query(..., description="Classroom chat ID to fetch email members for"),
    user_id: str = Depends(verify_jwt_token),
):
    try:

        print(f"✅ User {user_id} fetching email classroom members for classroom {classroom_chat_id}")
        response = fetch_email_classroom_members_controller(
            classroom_chat_id=classroom_chat_id
        )

        print(f"✅ Email classroom members response: {response}")
        return {"members": response}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching email classroom members: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/members/non-email")
async def fetch_non_email_classroom_members(
    classroom_chat_id: str = Query(..., description="Classroom chat ID to fetch non-email members for"),
    user_id: str = Depends(verify_jwt_token),
):
    try:

        print(f"✅ User {user_id} fetching non-email classroom members for classroom {classroom_chat_id}")
        response = fetch_non_email_classroom_members_controller(
            classroom_chat_id=classroom_chat_id
        )

        print(f"✅ Non-email classroom members response: {response}")
        return {"members": response}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching non-email classroom members: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))