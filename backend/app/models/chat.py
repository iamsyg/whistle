from pydantic import BaseModel
from typing import List
from datetime import datetime

class ConversationCreate(BaseModel):
    member_ids: List[str]

class ConversationResponse(BaseModel):
    id: str
    members: List[str]
    created_at: datetime

    class Config:
        from_attributes = True
