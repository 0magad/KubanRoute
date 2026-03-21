from typing import Any

from core.services.db import supabase


DEFAULT_USER_PROFILE: dict[str, Any] = {
    "interests": ["wine", "nature"],
    "travel_style": "couple",
    "budget_tier": "mid",
}


async def get_user_profile(user_id: str) -> dict[str, Any]:
    """
    Fetch user profile from storage.
    Returns a safe default profile if DB is unavailable or profile is missing.
    """
    if not user_id:
        return DEFAULT_USER_PROFILE.copy()

    if not supabase:
        return DEFAULT_USER_PROFILE.copy()

    try:
        profile_res = (
            supabase.table("user_profiles")
            .select("*")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )
        if profile_res and profile_res.data:
            return profile_res.data
    except Exception:
        pass

    return DEFAULT_USER_PROFILE.copy()
