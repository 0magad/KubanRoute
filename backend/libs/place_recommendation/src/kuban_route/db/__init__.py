"""Слой работы с БД (Supabase)."""
from .client import get_supabase
from .queries import (
    avg_rating_by_type,
    check_user_liked,
    count_similar_liked,
    fetch_first_profile,
    fetch_places,
    fetch_profile,
    find_similar_users,
)

__all__ = [
    "get_supabase",
    "avg_rating_by_type",
    "check_user_liked",
    "count_similar_liked",
    "fetch_first_profile",
    "fetch_places",
    "fetch_profile",
    "find_similar_users",
]
