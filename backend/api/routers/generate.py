"""
POST /api/generate — Generate a personalized route.
"""

from fastapi import APIRouter, HTTPException
from core.models.schemas import UserProfile
from core.services.route_generator import generate_route

router = APIRouter()


@router.post("/api/generate")
async def generate(profile: UserProfile):
    """Generate a personalized route based on user profile."""
    try:
        route = await generate_route(profile)
        return route.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Route generation failed: {str(e)}")
