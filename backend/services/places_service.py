"""
PlacesService: loads and queries places from seed_places.json
"""

import json
import os
from typing import Optional
from models.schemas import Place

from services.db import supabase

def _load_places():
    if not supabase:
        return []
    try:
        response = supabase.table('places').select('*').execute()
        return [Place(**p) for p in response.data] if response.data else []
    except Exception as e:
        import traceback
        traceback.print_exc()
        return []

def get_all_places(
    type_filter: Optional[str] = None,
    tags: Optional[list[str]] = None,
    season: Optional[int] = None,
    region: Optional[str] = None,
) -> list[Place]:
    """Get all approved places with optional filters."""
    _places = _load_places()
    result = [p for p in _places if getattr(p, 'status', 'approved') in ("approved", "pending")]

    if type_filter:
        result = [p for p in result if p.type == type_filter]

    if tags:
        result = [p for p in result if any(t in getattr(p, 'tags', []) for t in tags)]

    if season:
        result = [p for p in result if season in getattr(p, 'seasons', [])]

    if region:
        result = [p for p in result if region.lower() in p.region.lower()]

    return result

def get_place_by_id(place_id: str) -> Optional[Place]:
    """Get a single place by ID."""
    _places = _load_places()
    for p in _places:
        if str(p.id) == str(place_id):
            return p
    return None

def get_places_count() -> int:
    """Get total count of approved places."""
    _places = _load_places()
    return len([p for p in _places if getattr(p, 'status', 'approved') in ("approved", "pending")])
