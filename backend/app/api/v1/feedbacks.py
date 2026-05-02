from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import RequestUser, get_current_user, get_db
from app.models.feedback import Feedback
from app.schemas.feedback import FeedbackCreate, FeedbackResponse

router = APIRouter(prefix="/feedbacks", tags=["feedbacks"])


@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED, summary="Enviar feedback")
async def create_feedback(
    payload: FeedbackCreate,
    current_user: RequestUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FeedbackResponse:
    if current_user.company_id is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Superadmin não envia feedback de tenant.")

    feedback = Feedback(
        company_id=current_user.company_id,
        user_id=current_user.id,
        message=payload.message,
        rating=payload.rating,
    )
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    return FeedbackResponse.model_validate(
        {
            "id": feedback.id,
            "company_id": feedback.company_id,
            "user_id": feedback.user_id,
            "company_name": current_user.user.company.trade_name if current_user.user.company else None,
            "user_email": current_user.email,
            "message": feedback.message,
            "rating": feedback.rating,
            "created_at": feedback.created_at,
        }
    )
