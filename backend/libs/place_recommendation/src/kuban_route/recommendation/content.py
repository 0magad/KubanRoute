"""Content-Based Score (40%)."""
from typing import Union

from .. import db


async def content_score(
    place: Union[dict, "Place"], profile: Union[dict, "Profile"]
) -> float:
    """
    Совпадение интересов пользователя с местом.
    Jaccard по тегам + бонусы за рейтинг типа и похожие лайки + семантика.
    """
    # Нормализация в dict-подобный вид
    place_data = place.to_dict() if hasattr(place, "to_dict") else place
    profile_data = profile.to_dict() if hasattr(profile, "to_dict") else profile

    place_tags = set(place_data.get("tags", []))
    user_interests = set(profile_data.get("interests", []))
    user_dislikes = set(profile_data.get("dislikes", []))

    # Дизлайки — жёсткий штраф
    if place_tags & user_dislikes:
        return 0.0

    # Jaccard similarity
    union = place_tags | user_interests
    if not union:
        jaccard = 0.1
    else:
        jaccard = len(place_tags & user_interests) / len(union)

    # Бонус за высокий рейтинг мест того же типа у этого пользователя
    type_bonus = (
        await db.queries.avg_rating_by_type(profile_data["id"], place_data.get("type", ""))
    ) / 5.0

    # Бонус за лайкнутые похожие места
    liked_similar = await db.queries.count_similar_liked(
        profile_data["id"], list(place_tags)
    )
    like_bonus = min(liked_similar * 0.08, 0.3)

    # Семантическое сходство векторов
    semantic = 0.0
    place_emb = place_data.get("embedding")
    pref_vec = profile_data.get("preference_vector")
    if place_emb and pref_vec:
        import numpy as np
        a, b = np.array(place_emb), np.array(pref_vec)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a > 1e-8 and norm_b > 1e-8:
            semantic = float(np.dot(a, b) / (norm_a * norm_b))
        semantic = max(0.0, (semantic + 1) / 2)  # нормализация [-1,1] -> [0,1]

    return min(jaccard * 0.45 + type_bonus * 0.2 + like_bonus * 0.2 + semantic * 0.15, 1.0)
