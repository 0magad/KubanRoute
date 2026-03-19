"""
RouteGenerator: rule-based filtering + geo-clustering + LLM narration.
Implements the hybrid generation approach from the TZ.
"""

import hashlib
import json
import uuid
import logging
from datetime import datetime
from typing import Optional

import math

from models.schemas import (
    UserProfile, Place, RoutePlace, RouteDay, RouteMeta,
    RouteLogistics, GeneratedRoute,
)
from services.places_service import get_all_places
from services.llm_service import generate_narrative

logger = logging.getLogger(__name__)

# In-memory cache of generated routes
_routes_cache: dict[str, GeneratedRoute] = {}


# === Interest to tag mapping ===
INTEREST_TO_TAGS = {
    "wine": ["wine_tasting"],
    "nature": ["hiking", "nature"],
    "history": ["history"],
    "farming": ["farming", "gastronomy"],
    "active": ["hiking"],
    "remote": ["coworking", "remote_workers", "wifi"],
}

# === Group-type specific rules ===
GROUP_RULES = {
    "family": {
        "required_tags": ["child_friendly"],
        "excluded_tags": [],
        "max_places_per_day": 4,
        "include_food": True,
        "priority_types": ["farm", "craft", "nature"],
    },
    "elderly": {
        "required_tags": [],
        "excluded_tags": ["hiking"],
        "max_places_per_day": 3,
        "include_food": True,
        "priority_types": ["winery", "guesthouse", "restaurant"],
    },
    "solo": {
        "required_tags": [],
        "excluded_tags": [],
        "max_places_per_day": 5,
        "include_food": False,
        "priority_types": ["nature", "winery"],
    },
    "couple": {
        "required_tags": [],
        "excluded_tags": [],
        "max_places_per_day": 4,
        "include_food": True,
        "priority_types": ["winery", "nature", "restaurant"],
    },
    "company": {
        "required_tags": [],
        "excluded_tags": [],
        "max_places_per_day": 5,
        "include_food": True,
        "priority_types": ["winery", "farm", "nature"],
    },
}

# Days mapping
DAYS_MAP = {"1-2": 2, "3-5": 3, "7+": 5}

# Budget thresholds (max price per place)
BUDGET_MAX_PRICE = {"low": 500, "medium": 2000, "high": 99999}


def _profile_hash(profile: UserProfile) -> str:
    """Create a hash from user profile for caching."""
    data = json.dumps(profile.model_dump(), sort_keys=True)
    return hashlib.sha256(data.encode()).hexdigest()[:16]


def _geo_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Simple Euclidean distance between two geo points (sufficient for clustering)."""
    return math.sqrt((lat1 - lat2) ** 2 + (lng1 - lng2) ** 2)


def filter_places(profile: UserProfile) -> list[Place]:
    """
    Rule-based filtering from the TZ:
    1. Filter by interest tags
    2. Filter by group type constraints
    3. Filter by current season
    4. Filter by transport availability
    5. Filter by budget
    """
    current_month = datetime.now().month

    # Get interest tags
    interest_tags = []
    for interest in profile.interests:
        interest_tags.extend(INTEREST_TO_TAGS.get(interest, [interest]))

    # Get all places filtered by interest tags
    places = get_all_places()

    # 1. Filter by tags: places must have at least one matching interest tag
    # But also include food/guesthouse places for logistics
    places_with_interest = [
        p for p in places
        if any(t in p.tags for t in interest_tags)
    ]
    food_places = [p for p in places if p.type in ("restaurant",) and p not in places_with_interest]
    accommodation = [p for p in places if p.type == "guesthouse" and p not in places_with_interest]

    filtered = places_with_interest

    # 2. Filter by group type
    rules = GROUP_RULES.get(profile.group_type, GROUP_RULES["couple"])

    if rules["required_tags"]:
        # At least some places should have required tags, but don't exclude all
        preferred = [p for p in filtered if any(t in p.tags for t in rules["required_tags"])]
        others = [p for p in filtered if p not in preferred]
        filtered = preferred + others[:max(5, len(others))]

    if rules["excluded_tags"]:
        filtered = [p for p in filtered if not any(t in p.tags for t in rules["excluded_tags"])]

    # 3. Filter by season
    filtered = [p for p in filtered if current_month in p.seasons or not p.seasons]

    # 4. Filter by transport
    if profile.transport == "no":
        filtered = [p for p in filtered if not p.has_car_required]
        food_places = [p for p in food_places if not p.has_car_required]

    # 5. Filter by budget
    max_price = BUDGET_MAX_PRICE.get(profile.budget, 99999)
    filtered = [p for p in filtered if p.price_min <= max_price]

    # Add food places if needed
    if rules["include_food"]:
        food_season = [p for p in food_places if current_month in p.seasons or not p.seasons]
        food_budget = [p for p in food_season if p.price_min <= max_price]
        filtered.extend(food_budget[:3])

    # Prioritize by type
    if rules["priority_types"]:
        def sort_key(p):
            try:
                return rules["priority_types"].index(p.type)
            except ValueError:
                return len(rules["priority_types"])
        filtered.sort(key=sort_key)

    return filtered


def geo_cluster(places: list[Place], n_clusters: int) -> list[list[Place]]:
    """
    Cluster places by geographic proximity using a greedy nearest-neighbor algorithm.
    Pure Python — no external dependencies needed.
    Returns N lists of places (one per day).
    """
    if not places:
        return [[] for _ in range(n_clusters)]

    if len(places) <= n_clusters:
        clusters = [[] for _ in range(n_clusters)]
        for i, p in enumerate(places):
            clusters[i % n_clusters].append(p)
        return clusters

    # Greedy geographic clustering:
    # 1. Pick N seed points spread across the places
    # 2. Assign each place to the nearest seed
    remaining = list(places)
    seeds = []

    # Pick first seed (first place)
    seeds.append(remaining.pop(0))

    # Pick remaining seeds as the farthest points from existing seeds
    for _ in range(n_clusters - 1):
        if not remaining:
            break
        best_place = None
        best_dist = -1
        for p in remaining:
            min_dist = min(
                _geo_distance(p.lat, p.lng, s.lat, s.lng) for s in seeds
            )
            if min_dist > best_dist:
                best_dist = min_dist
                best_place = p
        if best_place:
            seeds.append(best_place)
            remaining.remove(best_place)

    # Assign all places to nearest seed
    clusters = [[] for _ in range(len(seeds))]
    for seed_idx, seed in enumerate(seeds):
        clusters[seed_idx].append(seed)

    for p in remaining:
        nearest_idx = 0
        nearest_dist = float('inf')
        for i, seed in enumerate(seeds):
            d = _geo_distance(p.lat, p.lng, seed.lat, seed.lng)
            if d < nearest_dist:
                nearest_dist = d
                nearest_idx = i
        clusters[nearest_idx].append(p)

    # Pad with empty lists if needed
    while len(clusters) < n_clusters:
        clusters.append([])

    return clusters


def build_itinerary(
    clusters: list[list[Place]],
    max_per_day: int = 4,
) -> list[dict]:
    """
    Build day-by-day itinerary from clustered places.
    Each day gets 3-5 places with time slots.
    """
    days = []
    start_times = ["09:00", "11:00", "13:00", "15:00", "17:00"]
    end_times = ["10:30", "12:30", "14:30", "16:30", "18:30"]

    for i, cluster in enumerate(clusters):
        places_for_day = cluster[:max_per_day]

        route_places = []
        for j, place in enumerate(places_for_day):
            route_places.append({
                "id": place.id,
                "name": place.name,
                "type": place.type.value if hasattr(place.type, 'value') else place.type,
                "short_description": place.short_description,
                "lat": place.lat,
                "lng": place.lng,
                "time_start": start_times[j] if j < len(start_times) else f"{9 + j * 2}:00",
                "time_end": end_times[j] if j < len(end_times) else f"{10 + j * 2}:30",
                "price_min": place.price_min,
                "price_max": place.price_max,
                "tags": place.tags,
                "photos": place.photos,
            })

        days.append({
            "day_number": i + 1,
            "title": "",
            "description": "",
            "places": route_places,
        })

    return days


def build_logistics(profile: UserProfile, places: list[Place]) -> dict:
    """Build logistics recommendations."""
    # Transport
    if profile.transport == "yes":
        transport = "Маршрут рассчитан на автомобиль. Расстояния между точками 15–50 км."
    elif profile.transport == "rent":
        transport = ("Рекомендуем арендовать автомобиль: Яндекс.Аренда или Localrent. "
                     "Расстояния между точками 15–50 км.")
    else:
        transport = ("Маршрут адаптирован для общественного транспорта. "
                     "Используйте автобусы и электрички между городами.")

    # Accommodation
    guesthouses = [p for p in places if p.type == "guesthouse"]
    if guesthouses:
        gh = guesthouses[0]
        accommodation = f"Рекомендуем: {gh.name} — {gh.price_min}–{gh.price_max} ₽/сутки."
    else:
        accommodation = "Рекомендуем искать жильё на Ostrovok.ru или Авито Недвижимость."

    # Food
    restaurants = [p for p in places if p.type == "restaurant"]
    if restaurants:
        food = f"Рекомендуем для обеда: {restaurants[0].name}."
    else:
        food = "Обед включён в маршрут: дегустации и фермерские кафе."

    return {
        "transport": transport,
        "accommodation": accommodation,
        "food": food,
    }


async def generate_route(profile: UserProfile) -> GeneratedRoute:
    """
    Main entry point: generate a full route from user profile.
    1. Rule-based filtering
    2. Geo-clustering by days
    3. Build itinerary structure
    4. LLM narration
    5. Assemble final route
    """
    p_hash = _profile_hash(profile)

    # Check cache
    if p_hash in _routes_cache:
        logger.info(f"Cache hit for profile {p_hash}")
        return _routes_cache[p_hash]

    # 1. Filter places
    filtered = filter_places(profile)
    logger.info(f"Filtered {len(filtered)} places for profile {profile.group_type}")

    if not filtered:
        # Fallback: return all places
        filtered = get_all_places()[:15]

    # 2. Determine number of days
    n_days = DAYS_MAP.get(profile.days, 3)

    # 3. Geo-cluster
    clusters = geo_cluster(filtered, n_days)

    # 4. Build itinerary
    rules = GROUP_RULES.get(profile.group_type, GROUP_RULES["couple"])
    days_structure = build_itinerary(clusters, max_per_day=rules["max_places_per_day"])

    # 5. LLM narration
    narrative = await generate_narrative(profile.model_dump(), days_structure)

    # 6. Merge narrative into structure
    title = narrative.get("title", "Маршрут по Краснодарскому краю")
    intro = narrative.get("intro", "")
    narrative_days = narrative.get("days", [])

    for day in days_structure:
        for nd in narrative_days:
            if nd.get("day_number") == day["day_number"]:
                day["title"] = nd.get("title", day.get("title", ""))
                day["description"] = nd.get("description", day.get("description", ""))
                break

    # 7. Build logistics
    logistics = build_logistics(profile, filtered)

    # 8. Assemble route
    share_token = uuid.uuid4().hex[:12]

    route = GeneratedRoute(
        id=str(uuid.uuid4()),
        share_token=share_token,
        title=title,
        intro=intro,
        profile=profile.model_dump(),
        meta=RouteMeta(
            days=n_days,
            budget=profile.budget,
            group_type=profile.group_type,
            interests=profile.interests,
        ),
        days=[
            RouteDay(
                day_number=d["day_number"],
                title=d.get("title", ""),
                description=d.get("description", ""),
                places=[RoutePlace(**p) for p in d["places"]],
            )
            for d in days_structure
        ],
        logistics=RouteLogistics(**logistics),
    )

    # Cache
    _routes_cache[p_hash] = route
    _routes_cache[share_token] = route

    logger.info(f"Generated route '{title}' with token {share_token}")
    return route


def get_route_by_token(token: str) -> Optional[GeneratedRoute]:
    """Get a cached route by share token."""
    return _routes_cache.get(token)
