from pydantic import BaseModel
from typing import Optional, Literal

class CreateClassroomRequest(BaseModel):
    title: str
    description: Optional[str] = None
    require_email: bool = True
    allow_student_chat: bool = True
    creator_email: str

class JoinClassroomRequest(BaseModel):
    class_code: str
    join_via: Literal["email", "phone", "username"]
    selected_email: Optional[str] = None