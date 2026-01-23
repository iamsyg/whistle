from pydantic import BaseModel
from typing import Optional

class CreateClassroomRequest(BaseModel):
    title: str
    description: Optional[str] = None
    require_email: bool = True
    allowed_student_chat: bool = True
    creator_email: str