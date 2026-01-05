from pydantic import BaseModel, Field, validator
from typing import Optional

class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)
    message_type: str = Field(default="text")
    reply_to_id: Optional[str] = None
    
    @validator('content')
    def content_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Content cannot be empty or whitespace only')
        return v.strip()
    
    @validator('message_type')
    def valid_message_type(cls, v):
        allowed = ['text', 'image', 'file', 'task', 'money_split']
        if v not in allowed:
            raise ValueError(f'Invalid message type. Must be one of: {allowed}')
        return v