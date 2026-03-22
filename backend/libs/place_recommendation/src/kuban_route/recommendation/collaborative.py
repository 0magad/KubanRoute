"""Collaborative Filtering Score (30%)."""
from typing import Union

from .. import db


async def collaborative_score(
    place_id: str, user_id: str, place: Union[dict, "Place"] | None = None
) -> float:
    """
    Оценка на основе похожих пользователей.
    Топ-50 пользователей с похожими лайками (Jaccard),
    взвешенная доля тех, кто лайкнул данное место.
    """
    similar = await db.queries.find_similar_users(user_id, limit=50)
    if not similar:
        return 0.0

    weighted, total = 0.0, 0.0
    for u in similar:
        other_uid = u.get("other_uid") or u.get("user_id")
        jaccard = float(u.get("jaccard", 0))
        if not other_uid:
            continue
        liked = await db.queries.check_user_liked(other_uid, place_id)
        if liked:
            weighted += jaccard
        total += jaccard

    return weighted / total if total > 0 else 0.0
