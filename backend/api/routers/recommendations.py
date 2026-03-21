from fastapi import APIRouter, Query
from core.services.recommendation_service import get_top_recommendations

router = APIRouter()

@router.get("/api/recommendations")
async def fetch_recommendations(
    user_id: str = Query(..., description="User ID"),
    limit: int = Query(5, description="Number of results")
):
    """Get personalized recommendations with LLM justifications."""
    return await get_top_recommendations(user_id, limit)
