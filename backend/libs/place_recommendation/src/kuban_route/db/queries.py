"""Запросы к БД для рекомендательной системы."""
import asyncio
from typing import Optional

from postgrest.exceptions import APIError

from .client import get_supabase


def _avg_rating_by_type_sync(user_id: str, place_type: str) -> float:
    try:
        supabase = get_supabase()
        r = (
            supabase.table("user_ratings")
            .select("rating, places!inner(type)")
            .eq("user_id", user_id)
            .eq("places.type", place_type)
            .execute()
        )
        if not r or not r.data or len(r.data) == 0:
            return 3.0
        total = sum(row["rating"] for row in r.data)
        return total / len(r.data)
    except APIError:
        return 3.0  # нейтрально, если таблица user_ratings отсутствует


async def avg_rating_by_type(user_id: str, place_type: str) -> float:
    """Средний рейтинг мест данного типа у этого пользователя [0, 5]."""
    return await asyncio.to_thread(_avg_rating_by_type_sync, user_id, place_type)


def _count_similar_liked_sync(user_id: str, place_tags: list[str]) -> int:
    if not place_tags:
        return 0
    try:
        supabase = get_supabase()
        liked = (
            supabase.table("user_events")
            .select("place_id, places(tags)")
            .eq("user_id", user_id)
            .eq("event_type", "card_like")
            .execute()
        )
        if not liked or not liked.data:
            return 0
        tags_set = set(place_tags)
        return sum(1 for row in liked.data if set((row.get("places") or {}).get("tags") or []) & tags_set)
    except APIError:
        return 0


async def count_similar_liked(user_id: str, place_tags: list[str]) -> int:
    """Количество лайкнутых мест с пересекающимися тегами."""
    return await asyncio.to_thread(_count_similar_liked_sync, user_id, place_tags)


def _find_similar_users_sync(target_uid: str, limit: int) -> list[dict]:
    try:
        supabase = get_supabase()
        r = supabase.rpc("find_similar_users", {"target_uid": target_uid, "lim": limit}).execute()
        return r.data or []
    except APIError:
        return []


async def find_similar_users(target_uid: str, limit: int = 50) -> list[dict]:
    """Найти пользователей с похожими лайками (Jaccard)."""
    return await asyncio.to_thread(_find_similar_users_sync, target_uid, limit)


def _check_user_liked_sync(user_id: str, place_id: str) -> bool:
    try:
        supabase = get_supabase()
        r = (
            supabase.table("user_events")
            .select("id")
            .eq("user_id", user_id)
            .eq("place_id", place_id)
            .eq("event_type", "card_like")
            .limit(1)
            .execute()
        )
        return len(r.data or []) > 0
    except APIError:
        return False


async def check_user_liked(user_id: str, place_id: str) -> bool:
    """Проверить, лайкал ли пользователь это место."""
    return await asyncio.to_thread(_check_user_liked_sync, user_id, place_id)


def _fetch_places_sync() -> list[dict]:
    """Загрузить все места из БД."""
    supabase = get_supabase()
    r = supabase.table("places").select("*").execute()
    return r.data or []


async def fetch_places() -> list[dict]:
    """Загрузить все места из БД."""
    return await asyncio.to_thread(_fetch_places_sync)


def _fetch_profile_sync(user_id: str) -> dict | None:
    """Загрузить профиль пользователя по id (UUID)."""
    supabase = get_supabase()
    r = supabase.table("user_profiles").select("*").eq("id", user_id).maybe_single().execute()
    return r.data if r is not None else None


async def fetch_profile(user_id: str) -> dict | None:
    """Загрузить профиль пользователя по id (UUID)."""
    return await asyncio.to_thread(_fetch_profile_sync, user_id)


def _fetch_first_profile_sync() -> dict | None:
    """Загрузить первый профиль (для демо, когда id неизвестен)."""
    supabase = get_supabase()
    r = supabase.table("user_profiles").select("*").limit(1).execute()
    if r is None:
        return None
    data = r.data or []
    return data[0] if data else None


async def fetch_first_profile() -> dict | None:
    """Загрузить первый профиль (для демо)."""
    return await asyncio.to_thread(_fetch_first_profile_sync)
