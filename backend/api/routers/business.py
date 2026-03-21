"""
POST /api/business/submit — Submit a business place.
"""

from fastapi import APIRouter, HTTPException
from core.models.schemas import BusinessSubmission
from core.services.business_service import save_submission

router = APIRouter()


@router.post("/api/business/submit")
async def submit_business(submission: BusinessSubmission):
    """Submit a new business place for moderation."""
    try:
        result = save_submission(submission.model_dump())
        return {
            "success": True,
            "message": "Спасибо! Ваше место будет проверено в течение 24 часов.",
            "submission_id": result["id"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Submission failed: {str(e)}")
