"""
GET /api/places — List places.
GET /api/places/{id} — Place details.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from core.services.places_service import get_all_places, get_place_by_id

router = APIRouter()


@router.get("/api/places")
def list_places(
    type: Optional[str] = Query(None, description="Filter by place type"),
    tags: Optional[str] = Query(None, description="Comma-separated tags"),
    season: Optional[int] = Query(None, description="Month number (1-12)"),
    region: Optional[str] = Query(None, description="Region name"),
):
    """List all approved places with optional filters."""
    tag_list = tags.split(",") if tags else None
    places = get_all_places(
        type_filter=type,
        tags=tag_list,
        season=season,
        region=region,
    )
    return [p.model_dump() for p in places]


@router.get("/api/places/{place_id}")
def get_place(place_id: str):
    """Get a single place by ID."""
    place = get_place_by_id(place_id)
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    return place.model_dump()
