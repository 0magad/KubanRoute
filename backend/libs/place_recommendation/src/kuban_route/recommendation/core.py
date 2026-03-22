"""Ядро рекомендательной системы — итоговая формула и API."""
from typing import Any, Optional, Union

from ..config import (
    SCORE_THRESHOLD,
    WEIGHT_COLLABORATIVE,
    WEIGHT_CONTENT,
    WEIGHT_PROFILE,
    WEIGHT_WEATHER,
)
from .collaborative import collaborative_score
from .content import content_score
from .justification import generate_justification
from .profile_filter import profile_filter
from .weather import weather_score


async def score_place(
    place: Union[dict, Any],
    profile: Union[dict, Any],
    weather: Optional[Union[dict, Any]] = None,
) -> dict[str, float]:
    """
    Вычисляет SCORE места и компоненты.
    Возвращает: { "total": float, "content": float, "collaborative": float,
                  "profile": float, "weather": float }
    """
    place_id = place.get("id", "")
    profile_id = profile.get("id", "")

    c_score = await content_score(place, profile)
    col_score = await collaborative_score(place_id, profile_id, place)
    p_score = profile_filter(place, profile)
    w_score = weather_score(place, weather, profile)

    total = (
        WEIGHT_CONTENT * c_score
        + WEIGHT_COLLABORATIVE * col_score
        + WEIGHT_PROFILE * p_score
        + WEIGHT_WEATHER * w_score
    )

    return {
        "total": total,
        "content": c_score,
        "collaborative": col_score,
        "profile": p_score,
        "weather": w_score,
    }


async def get_recommendations(
    places: list[Union[dict, Any]],
    profile: Union[dict, Any],
    weather_by_place: Optional[dict[str, Union[dict, Any]]] = None,
    top_k: int = 20,
    include_justification: bool = False,
) -> list[dict[str, Any]]:
    """
    Рекомендует топ мест для пользователя.
    Места с SCORE < 0.1 не показываются.
    """
    weather_by_place = weather_by_place or {}
    scored: list[tuple[dict, dict[str, float]]] = []

    for place in places:
        place_id = place.get("id", "")
        weather = weather_by_place.get(place_id)
        s = await score_place(place, profile, weather)
        if s["total"] >= SCORE_THRESHOLD:
            scored.append((place, s))

    scored.sort(key=lambda x: x[1]["total"], reverse=True)
    results = scored[:top_k]

    out = []
    for place, s in results:
        item = {
            "place": place,
            "score": s["total"],
            "components": {
                "content": s["content"],
                "collaborative": s["collaborative"],
                "profile": s["profile"],
                "weather": s["weather"],
            },
        }
        if include_justification:
            justification = await generate_justification(
                place,
                profile,
                s["weather"],
                weather_note="",
            )
            item["justification"] = justification
        out.append(item)

    return out
