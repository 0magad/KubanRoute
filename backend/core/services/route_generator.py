import hashlib
import json
import uuid
import logging
import random
import math
from datetime import datetime
from typing import Optional
from core.models.schemas import (
    UserProfile, Place, RoutePlace, RouteDay, RouteMeta,
    RouteLogistics, GeneratedRoute,
)
from core.services.llm_service import generate_narrative
from core.services.recommendation_service import get_top_recommendations
from core.services.db import supabase

logger = logging.getLogger(__name__)

_routes_cache: dict[str, GeneratedRoute] = {}
DAYS_MAP = {"1-2": 2, "3-5": 3, "7+": 5}


def _profile_hash(profile: UserProfile) -> str:
    data = json.dumps(profile.model_dump(), sort_keys=True)
    return hashlib.sha256(data.encode()).hexdigest()[:16]


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance in km between two coordinates."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def build_sequential_route(places: list[dict]) -> list[dict]:
    """
    Build ONE continuous sequential route using nearest-neighbor algorithm.
    This creates a single graph path where each stop leads logically to the next.
    """
    if len(places) <= 1:
        return places

    # Start from the northernmost place (natural entry point to Krasnodar Krai)
    remaining = list(places)
    remaining.sort(key=lambda p: float(p['lat']), reverse=True)
    route = [remaining.pop(0)]

    while remaining:
        last = route[-1]
        nearest = min(remaining, key=lambda p: haversine_km(
            float(last['lat']), float(last['lng']),
            float(p['lat']), float(p['lng'])
        ))
        route.append(nearest)
        remaining.remove(nearest)

    return route


def split_into_days(route: list[dict], n_days: int) -> list[list[dict]]:
    """
    Split one continuous route into days.
    Instead of KMeans clusters, we simply divide the sequential path
    into roughly equal segments — this keeps each day's stops close together
    and the overall journey progresses geographically.
    """
    if not route:
        return []

    places_per_day = max(2, len(route) // n_days)
    days = []

    for i in range(0, len(route), places_per_day):
        chunk = route[i:i + places_per_day]
        if chunk:
            # If last chunk is too small (1 place), merge with previous day
            if len(chunk) == 1 and days:
                days[-1].extend(chunk)
            else:
                days.append(chunk)

    return days[:n_days]  # cap at requested days


async def generate_route(profile: UserProfile) -> GeneratedRoute:
    user_id = "mock-user-id"

    p_hash = _profile_hash(profile)
    if p_hash in _routes_cache:
        logger.info(f"Cache hit for profile {p_hash}")
        return _routes_cache[p_hash]

    n_days = DAYS_MAP.get(profile.days, 3)

    # 1. Get ML Recommendations
    recs_data = await get_top_recommendations(user_id, limit=n_days * 5, survey_profile=profile)
    places_dicts = recs_data.get("places", [])
    weather = recs_data.get("weather", {})
    justifications = recs_data.get("justifications", {})

    if not places_dicts:
        raise ValueError("No matching places found from recommendations.")

    # 2. Build ONE sequential route (single continuous graph)
    sequential = build_sequential_route(places_dicts)

    # 3. Split into days (preserving geographic sequence)
    day_groups = split_into_days(sequential, n_days)

    # 4. Build route data with time slots and distances
    start_times = ["09:30", "11:30", "13:30", "15:30", "17:30"]
    end_times = ["11:00", "13:00", "15:00", "17:00", "19:00"]

    day_plans = []
    total_distance = 0.0

    for di, group in enumerate(day_groups):
        route_places = []
        day_distance = 0.0

        for j, p in enumerate(group):
            short_desc = justifications.get(str(p['id']), p.get('short_description', p.get('short_desc', '')))

            # Calculate distance from previous point
            dist_from_prev = 0.0
            if j > 0:
                prev = group[j - 1]
                dist_from_prev = haversine_km(
                    float(prev['lat']), float(prev['lng']),
                    float(p['lat']), float(p['lng'])
                )
                day_distance += dist_from_prev
            elif di > 0 and day_plans:
                # Distance from last point of previous day
                prev_day_last = day_plans[-1]["places"][-1]
                dist_from_prev = haversine_km(
                    prev_day_last["lat"], prev_day_last["lng"],
                    float(p['lat']), float(p['lng'])
                )
                day_distance += dist_from_prev

            route_places.append({
                "id": str(p['id']),
                "name": p.get('name', ''),
                "type": p.get('type', 'nature'),
                "short_description": short_desc,
                "lat": float(p.get('lat', 0)),
                "lng": float(p.get('lng', 0)),
                "time_start": start_times[j] if j < len(start_times) else "18:00",
                "time_end": end_times[j] if j < len(end_times) else "19:30",
                "price_min": p.get('price_min', 0),
                "price_max": p.get('price_max', 0),
                "tags": p.get('tags', []),
                "photos": p.get('photos', []),
                "distance_from_prev_km": round(dist_from_prev, 1),
            })

        total_distance += day_distance

        day_plans.append({
            "day_number": di + 1,
            "title": "",
            "description": "",
            "places": route_places,
            "total_km": round(day_distance, 1),
        })

    # 5. LLM narrative
    narrative = await generate_narrative(profile.model_dump(), day_plans)

    title = narrative.get("title", "Маршрут по Краснодарскому краю")
    intro = narrative.get("intro", "")
    weather_desc = f"Погода: {weather.get('temp', 22)}°C, {weather.get('description', 'ясно')}."

    if intro:
        intro += " " + weather_desc
    else:
        intro = f"Общая протяжённость маршрута: {round(total_distance, 1)} км. {weather_desc}"

    for day in day_plans:
        for nd in narrative.get("days", []):
            if nd.get("day_number") == day["day_number"]:
                day["title"] = nd.get("title", day.get("title", ""))
                day["description"] = nd.get("description", day.get("description", ""))
                break

    share_token = uuid.uuid4().hex[:12]

    route = GeneratedRoute(
        id=str(uuid.uuid4()),
        share_token=share_token,
        title=title,
        intro=intro,
        profile=profile.model_dump(),
        meta=RouteMeta(days=n_days, budget=profile.budget, group_type=profile.group_type, interests=profile.interests),
        days=[RouteDay(
            day_number=d["day_number"],
            title=d["title"],
            description=d["description"],
            places=[RoutePlace(**{k: v for k, v in p.items() if k != 'distance_from_prev_km'}) for p in d["places"]]
        ) for d in day_plans],
        logistics=RouteLogistics(
            transport=f"Автомобиль. Общий пробег ~{round(total_distance, 0):.0f} км.",
            accommodation="Гостевые дома и отели по маршруту",
            food="Рекомендуемые рестораны и фермерские кафе на каждой остановке"
        ),
    )

    _routes_cache[p_hash] = route
    _routes_cache[share_token] = route

    return route


def get_route_by_token(token: str) -> Optional[GeneratedRoute]:
    return _routes_cache.get(token)
