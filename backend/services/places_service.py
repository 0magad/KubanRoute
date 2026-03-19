"""
PlacesService: loads and queries places from seed_places.json
"""

import json
import os
from typing import Optional
from models.schemas import Place

# Load seed data once at module level
_DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'seed_places.json')

_places: list[Place] = []


def _load_places():
    global _places
    if _places:
        return
    with open(_DATA_PATH, 'r', encoding='utf-8') as f:
        raw = json.load(f)
    _places = [Place(**p) for p in raw]


def get_all_places(
    type_filter: Optional[str] = None,
    tags: Optional[list[str]] = None,
    season: Optional[int] = None,
    region: Optional[str] = None,
) -> list[Place]:
    """Get all approved places with optional filters."""
    _load_places()
    result = [p for p in _places if p.status == "approved"]

    if type_filter:
        result = [p for p in result if p.type == type_filter]

    if tags:
        result = [p for p in result if any(t in p.tags for t in tags)]

    if season:
        result = [p for p in result if season in p.seasons]

    if region:
        result = [p for p in result if region.lower() in p.region.lower()]

    return result


def get_place_by_id(place_id: str) -> Optional[Place]:
    """Get a single place by ID."""
    _load_places()
    for p in _places:
        if p.id == place_id:
            return p
    return None


def get_places_count() -> int:
    """Get total count of approved places."""
    _load_places()
    return len([p for p in _places if p.status == "approved"])
