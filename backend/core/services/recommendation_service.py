"""
Recommendation service: uses KubanRoute library when available, with legacy fallback.
"""

import logging
from datetime import datetime
from typing import Optional, Union

import config  # Ensures SUPABASE_KEY patch before kuban_route import
from core.services.db import supabase
from core.services.weather_service import get_weather
from core.services.places_service import get_all_places

try:
    from kuban_route.recommendation import get_recommendations as kr_get_recommendations
    KUBAN_ROUTE_AVAILABLE = True
except ImportError:
    KUBAN_ROUTE_AVAILABLE = False
    kr_get_recommendations = None

logger = logging.getLogger(__name__)


def _app_place_to_kr(place_dict: dict) -> dict:
    """Convert app Place dict to KubanRoute format."""
    return {
        "id": str(place_dict.get("id", "")),
        "name": place_dict.get("name", ""),
        "type": str(place_dict.get("type", "place")),
        "tags": place_dict.get("tags", []),
        "price_min": place_dict.get("price_min", 0),
        "car_required": place_dict.get("has_car_required", False),
        "embedding": place_dict.get("embedding"),
        "avg_rating": place_dict.get("avg_rating", 0.0),
        "review_count": place_dict.get("review_count", 0),
        "lat": place_dict.get("lat"),
        "lng": place_dict.get("lng"),
        "short_description": place_dict.get("short_description", ""),
        "photos": place_dict.get("photos", []),
        "price_max": place_dict.get("price_max", 0),
        **{k: v for k, v in place_dict.items() if k not in (
            "id", "name", "type", "tags", "price_min", "car_required",
            "embedding", "avg_rating", "review_count", "has_car_required"
        )},
    }


def _build_profile_from_survey(survey: dict) -> dict:
    """Build KubanRoute profile from survey UserProfile."""
    budget_map = {"low": "low", "medium": "mid", "high": "high"}
    transport = survey.get("transport", "yes")
    has_car = transport in ("yes", "rent")
    group_type = survey.get("group_type", "couple")
    has_children = group_type == "family"
    age_group = "senior" if group_type == "elderly" else ("young" if group_type == "solo" else "adult")
    return {
        "id": "survey-user",
        "interests": survey.get("interests", []),
        "dislikes": survey.get("dislikes", []),
        "has_car": has_car,
        "has_children": has_children,
        "budget_tier": budget_map.get(survey.get("budget", "medium"), "mid"),
        "travel_style": group_type,
        "age_group": age_group,
    }


def _app_weather_to_kr(weather: dict) -> dict:
    """Convert app weather to KubanRoute format (temperature, precipitation)."""
    precip = 5.0 if (weather.get("is_raining") or weather.get("is_snowing")) else 0.0
    return {
        "temperature": weather.get("temp", 20),
        "precipitation": precip,
        "description": weather.get("description", "ясно"),
    }


# --- Legacy fallback (when KubanRoute unavailable or fails) ---

def _legacy_weather_score(place: dict, weather: dict, profile: dict) -> float:
    temp = weather.get('temp', 20)
    feels_like = weather.get('feels_like', 20)
    is_raining = weather.get('is_raining', False)
    is_snowing = weather.get('is_snowing', False)
    is_outdoor = place.get('outdoor', True)
    w_sensitive = place.get('weather_sensitive', True)
    month = weather.get('month', datetime.now().month)
    user_pref = profile.get('weather_preference', 'any')
    min_comfort = profile.get('min_temp_comfort', 10)

    if user_pref == 'indoor_only':
        return 0.9 if not is_outdoor else 0.3
    if not is_outdoor or not w_sensitive:
        if is_raining or is_snowing or feels_like < 5:
            return 0.95
        return 0.80
    score = 1.0
    if feels_like < min_comfort:
        penalty = (min_comfort - feels_like) / 20.0
        score -= min(penalty, 0.75)
    elif feels_like > 37:
        penalty = (feels_like - 37) / 15.0
        score -= min(penalty, 0.50)
    elif 17 <= feels_like <= 27:
        score += 0.10
    if is_raining:
        score -= 0.50
    if is_snowing:
        if 'winter_activity' in place.get('tags', []):
            score += 0.20
        else:
            score -= 0.60
    if weather.get('wind_speed', 0) > 15:
        if any(t in place.get('tags', []) for t in ['hiking', 'beach', 'festival']):
            score -= 0.20
    seasons = place.get('seasons', [])
    if seasons and month not in seasons:
        score -= 0.30
    if user_pref == 'warm' and feels_like < 20:
        score -= 0.20
    if user_pref == 'cold' and feels_like > 25:
        score -= 0.20
    return max(0.0, min(1.0, score))


async def _legacy_content_score(place: dict, profile: dict) -> float:
    place_tags = set(place.get('tags', []))
    user_interests = set(profile.get('interests', []))
    user_dislikes = set(profile.get('dislikes', []))
    if place_tags & user_dislikes:
        return 0.0
    if not (place_tags | user_interests):
        return 0.1
    jaccard = len(place_tags & user_interests) / len(place_tags | user_interests)
    return min(jaccard * 0.45 + 0.3, 1.0)


async def _legacy_collaborative_score(place_id: str, user_id: str) -> float:
    return 0.5


def _legacy_profile_filter(place: dict, profile: dict) -> float:
    score = 1.0
    if profile.get('has_car') is False and place.get('car_required', place.get('has_car_required')):
        return 0.0
    budget_caps = {'low': 1000, 'mid': 5000, 'high': 999999}
    b_tier = profile.get('budget_tier')
    if b_tier and b_tier in budget_caps:
        if place.get('price_min', 0) > budget_caps[b_tier]:
            return 0.0
    tags = place.get('tags', [])
    if profile.get('has_children') and 'child_friendly' not in tags:
        score *= 0.4
    if profile.get('age_group') == 'senior' and 'hiking' in tags:
        score *= 0.2
    ts = profile.get('travel_style')
    if ts == 'couple' and 'couples' in tags:
        score *= 1.5
    if ts == 'family' and 'child_friendly' in tags:
        score *= 1.4
    if ts in ('solo', 'remote_workers') and 'remote_workers' in tags:
        score *= 1.3
    return min(score, 1.0)


async def _legacy_generate_justification(place: dict, profile: dict, weather_score_val: float, weather: dict) -> str:
    import httpx
    from config import OPENAI_API_KEY

    prompt = f"""
Ты — персональный советник по путешествиям. Пишешь коротко и по-человечески.
Профиль: Тип: {profile.get('travel_style')}, Интересы: {profile.get('interests')}, Бюджет: {profile.get('budget_tier')}.
Место: {place.get('name')} (тип: {place.get('type')}). Теги: {place.get('tags')}. 
Погодный балл: {weather_score_val:.0%} ({weather.get('description')}).
Напиши 2 живых предложения, почему место подходит именно этому пользователю. Без клише.
    """
    if not OPENAI_API_KEY:
        return f"Это место ({place.get('name')}) идеально подходит под ваши интересы и текущую погоду."
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            res = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
                json={
                    "model": "gpt-4o-mini",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 100
                }
            )
            return res.json()["choices"][0]["message"]["content"]
    except Exception as e:
        logger.warning(f"Justification failed: {e}")
        return "Отличное место для вашего сценария."


async def _run_legacy_recommendations(
    user_id: str,
    limit: int,
    profile: dict,
    places: list,
    weather: dict,
) -> dict:
    scored_places = []
    for p in places:
        p_dict = p.model_dump() if hasattr(p, "model_dump") else p
        p_dict.setdefault("car_required", p_dict.get("has_car_required", False))
        c_score = await _legacy_content_score(p_dict, profile)
        col_score = await _legacy_collaborative_score(str(p_dict.get("id", "")), user_id)
        p_filter = _legacy_profile_filter(p_dict, profile)
        w_score = _legacy_weather_score(p_dict, weather, profile)
        total_score = (0.4 * c_score) + (0.3 * col_score) + (0.2 * p_filter) + (0.1 * w_score)
        if total_score >= 0.1:
            scored_places.append({"place": p_dict, "score": total_score, "weather_score": w_score})
    scored_places.sort(key=lambda x: x["score"], reverse=True)
    top_candidates = scored_places[:limit]
    justifications = {}
    scores = {}
    for c in top_candidates:
        pid = str(c["place"]["id"])
        scores[pid] = c["score"]
        justifications[pid] = await _legacy_generate_justification(
            c["place"], profile, c["weather_score"], weather
        )
    return {
        "user_id": user_id,
        "places": [c["place"] for c in top_candidates],
        "justifications": justifications,
        "scores": scores,
        "weather": weather,
    }


async def get_top_recommendations(
    user_id: str,
    limit: int = 5,
    survey_profile: Optional[Union[dict, "UserProfile"]] = None,
) -> dict:
    """
    Get personalized place recommendations.
    Uses KubanRoute library when available; falls back to legacy logic on error.
    survey_profile: optional UserProfile from survey (makes recommendations truly personalized).
    """
    # 1. Resolve profile
    profile = {}
    if survey_profile is not None:
        if hasattr(survey_profile, "model_dump"):
            profile = _build_profile_from_survey(survey_profile.model_dump())
        else:
            profile = _build_profile_from_survey(survey_profile)
    if not profile and supabase:
        try:
            profile_res = supabase.table("user_profiles").select("*").eq("id", user_id).maybe_single().execute()
            if profile_res.data:
                profile = profile_res.data
                profile.setdefault("id", user_id)
        except Exception:
            pass
    if not profile:
        profile = _build_profile_from_survey({
            "interests": ["wine", "nature"],
            "travel_style": "couple",
            "budget": "medium",
            "transport": "yes",
            "group_type": "couple",
        })

    weather = await get_weather("Краснодар")
    places = get_all_places()

    if not places:
        return {
            "user_id": user_id,
            "places": [],
            "justifications": {},
            "scores": {},
            "weather": weather,
        }

    # 2. Try KubanRoute
    if KUBAN_ROUTE_AVAILABLE and kr_get_recommendations:
        try:
            places_dicts = [p.model_dump() if hasattr(p, "model_dump") else p for p in places]
            kr_places = [_app_place_to_kr(p) for p in places_dicts]
            kr_weather = _app_weather_to_kr(weather)
            weather_by_place = {str(p["id"]): kr_weather for p in kr_places}

            results = await kr_get_recommendations(
                kr_places,
                profile,
                weather_by_place=weather_by_place,
                top_k=limit,
                include_justification=True,
            )

            # Convert back to app format (restore original keys)
            out_places = []
            justifications = {}
            scores = {}
            for r in results:
                place = r["place"]
                pid = str(place.get("id", ""))
                out_place = {**place}
                out_place["has_car_required"] = place.get("car_required", False)
                out_place["lat"] = place.get("lat")
                out_place["lng"] = place.get("lng")
                out_place["short_description"] = place.get("short_description", "")
                out_place["photos"] = place.get("photos", [])
                out_place["price_max"] = place.get("price_max", 0)
                out_places.append(out_place)
                scores[pid] = r["score"]
                justifications[pid] = r.get("justification", "Подходит под ваши предпочтения.")

            logger.info("Using KubanRoute recommendations")
            return {
                "user_id": user_id,
                "places": out_places,
                "justifications": justifications,
                "scores": scores,
                "weather": weather,
            }
        except Exception as e:
            logger.warning("KubanRoute failed, using legacy: %s", e)

    # 3. Legacy fallback
    return await _run_legacy_recommendations(user_id, limit, profile, places, weather)
