# backend/app/routes/chat/split/split.py

from fastapi import APIRouter, Depends, Body, HTTPException
from typing import List, Optional
import traceback
from decimal import Decimal
from typing import Literal

from app.middlewares.secure_route import verify_jwt_token

from app.controllers.chat.split.create_split import create_split_controller

from app.controllers.chat.split.fetch_split_list import fetch_split_list_controller

from app.controllers.chat.split.pay_split import pay_split_controller

from app.controllers.chat.split.settle_split import settle_split_controller

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
    

@router.get("/list/{chat_id}")
async def fetch_split_list_endpoint(
    chat_id: str,
    current_user_id: str = Depends(verify_jwt_token)
):
    
    try:

        response = await fetch_split_list_controller(
            chat_id=chat_id,
            current_user_id=current_user_id
        )

        print(f"✅ Fetched split list for chat {chat_id}: {response}")
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching split list: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
    


@router.post("/pay/{split_id}")
async def pay_split_endpoint(
    split_id: str,
    current_user_id: str = Depends(verify_jwt_token),
):
    """
    Non-payer marks their own share as paid.
    If all non-payers have now paid, the split is auto-settled.
    """
    try:
        return pay_split_controller(
            split_id=split_id,
            current_user_id=current_user_id,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.post("/settle/{split_id}")
async def settle_split_endpoint(
    split_id: str,
    current_user_id: str = Depends(verify_jwt_token),
):
    """
    Payer force-settles the entire split, marking all pending members as paid.
    """
    try:
        return settle_split_controller(
            split_id=split_id,
            current_user_id=current_user_id,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))