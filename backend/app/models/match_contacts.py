# # backend/app/models/match_contacts.py

# from pydantic import BaseModel, Field

# class MatchContactsRequest(BaseModel):
#     phone_hashes: list[str] = Field(..., min_items=1, max_items=5000)


from pydantic import BaseModel, Field, field_validator
from typing import List

class MatchContactsRequest(BaseModel):
    phone_hashes: List[str] = Field(..., min_items=0, max_items=5000)
    
    @field_validator('phone_hashes')
    @classmethod
    def validate_hashes(cls, v):
        # Remove empty strings if any
        return [h for h in v if h and h.strip()]