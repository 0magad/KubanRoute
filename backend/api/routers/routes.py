"""
GET /api/routes/{token} — Get a shared route by token.
"""

from fastapi import APIRouter, HTTPException
from core.services.route_generator import get_route_by_token

router = APIRouter()


@router.get("/api/routes/{token}")
def get_route(token: str):
    """Get a generated route by its share token."""
    route = get_route_by_token(token)
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    return route.model_dump()
