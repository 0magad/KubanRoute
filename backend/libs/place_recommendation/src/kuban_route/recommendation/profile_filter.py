"""Profile Filter (20%)."""
from typing import Union


BUDGET_CAPS = {"low": 1000, "mid": 5000, "high": 999999}


def profile_filter(
    place: Union[dict, "Place"], profile: Union[dict, "Profile"]
) -> float:
    """
    Фильтр по портрету: авто, дети, бюджет.
    Жёсткие исключения -> 0, мягкие штрафы и бонусы -> [0, 1].
    """
    place_data = place.to_dict() if hasattr(place, "to_dict") else place
    profile_data = profile.to_dict() if hasattr(profile, "to_dict") else profile

    score = 1.0

    # --- ЖЁСТКИЕ ИСКЛЮЧЕНИЯ ---
    if profile_data.get("has_car") is False and place_data.get("car_required"):
        return 0.0  # Нет машины, а место требует авто

    if profile_data.get("budget_tier"):
        budget_cap = BUDGET_CAPS.get(
            profile_data["budget_tier"], BUDGET_CAPS["mid"]
        )
        if place_data.get("price_min", 0) > budget_cap:
            return 0.0  # Не по карману

    # --- МЯГКИЕ ШТРАФЫ ---
    place_tags = set(place_data.get("tags", []))
    if profile_data.get("has_children") and "child_friendly" not in place_tags:
        score *= 0.4  # Дети есть, место не адаптировано

    if (
        profile_data.get("age_group") == "senior"
        and "hiking" in place_tags
    ):
        score *= 0.2  # Сложный треккинг для пожилых

    # --- БОНУСЫ ---
    travel_style = profile_data.get("travel_style")
    if travel_style == "couple" and "couples" in place_tags:
        score *= 1.5
    if travel_style == "family" and "child_friendly" in place_tags:
        score *= 1.4
    if travel_style in ("solo", "remote_workers") and "remote_workers" in place_tags:
        score *= 1.3

    return min(score, 1.0)
