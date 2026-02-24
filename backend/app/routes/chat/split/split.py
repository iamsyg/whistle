# backend/app/routes/chat/split/create_split.py

from fastapi import APIRouter, Depends, Body, HTTPException
from typing import List, Optional
import traceback
from decimal import Decimal
from typing import Literal

from app.middlewares.secure_route import verify_jwt_token

from app.controllers.chat.split.create_split import create_split_controller

router = APIRouter(prefix="/split", tags=["Split"])


@router.post("/create/{chat_id}")
async def create_split_endpoint(
    chat_id: str,
    title: Optional[str] = Body(None, embed=True),
    total_amount: Decimal = Body(..., embed=True),
    currency: str = Body(..., embed=True),
    split_type: Literal["equally", "unequally"] = Body(..., embed=True),
    members: List[dict] = Body(..., embed=True),
    paid_by: str = Body(..., embed=True),
    creator_id: str = Depends(verify_jwt_token)
):
    """
    Create a split bill in the chat
    """

    try:

        split = create_split_controller(
            chat_id=chat_id,
            title=title,
            total_amount=total_amount,
            currency=currency,
            split_type=split_type,
            members=members,
            paid_by=paid_by,
            creator_id=creator_id,  
        )

        print(f"✅ Created split bill: {split}")
        return split
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creating split bill: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))