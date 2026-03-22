import hashlib
import json
import uuid
import logging
import random
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

def nearest_neighbor_sort(places: list[dict]) -> list[dict]:
    if len(places) <= 2: return places
    result = [places.pop(0)]
    while places:
        last = result[-1]
        nearest = min(places, key=lambda p:
            (p['lat']-last['lat'])**2 + (p['lng']-last['lng'])**2)
        result.append(nearest)
        places.remove(nearest)
    return result

async def generate_route(profile: UserProfile) -> GeneratedRoute:
    user_id = "mock-user-id" # In real app use profile.id if available
    
    p_hash = _profile_hash(profile)
    if p_hash in _routes_cache:
        logger.info(f"Cache hit for profile {p_hash}")
        return _routes_cache[p_hash]

    n_days = DAYS_MAP.get(profile.days, 3)
    
    # 1. ML Recommendations (pass survey profile for personalized scoring)
    recs_data = await get_top_recommendations(user_id, limit=n_days * 6, survey_profile=profile)
    places_dicts = recs_data.get("places", [])
    weather = recs_data.get("weather", {})
    justifications = recs_data.get("justifications", {})

    if not places_dicts:
        raise ValueError("No matching places found from recommendations.")

    # 2. Pure Python KMeans Clustering fallback
    def euclidean_dist(p1, p2):
        return ((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)**0.5
        
    coords = [[float(p['lat']), float(p['lng'])] for p in places_dicts]
    k = min(n_days, len(places_dicts))
    labels = [0] * len(places_dicts)
    
    if k > 1:
        # Init centroids randomly
        centroids = random.sample(coords, k)
        for _ in range(10): # 10 iterations max
            # Assign clusters
            new_labels = []
            for c in coords:
                distances = [euclidean_dist(c, cent) for cent in centroids]
                new_labels.append(distances.index(min(distances)))
            labels = new_labels
            # Update centroids
            for i in range(k):
                cluster_points = [coords[j] for j in range(len(coords)) if labels[j] == i]
                if cluster_points:
                    centroids[i] = [sum(pt[0] for pt in cluster_points)/len(cluster_points), 
                                    sum(pt[1] for pt in cluster_points)/len(cluster_points)]
        
    day_plans = []
    start_times = ["10:00", "12:00", "14:00", "16:00", "18:00"]
    end_times = ["11:30", "13:30", "15:30", "17:30", "19:30"]

    for di in range(k):
        # group places per label
        group = [p for p, l in zip(places_dicts, labels) if l == di][:5]
        # sort traveling salesman
        group = nearest_neighbor_sort(group)
        
        route_places = []
        for j, p in enumerate(group):
            # inject justifications
            short_desc = justifications.get(str(p['id']), p.get('short_description', ''))
            route_places.append({
                "id": str(p['id']),
                "name": p.get('name', ''),
                "type": p.get('type', 'place'),
                "short_description": short_desc,
                "lat": float(p.get('lat', 0)),
                "lng": float(p.get('lng', 0)),
                "time_start": start_times[j] if j < len(start_times) else "20:00",
                "time_end": end_times[j] if j < len(end_times) else "21:30",
                "price_min": p.get('price_min', 0),
                "price_max": p.get('price_max', 0),
                "tags": p.get('tags', []),
                "photos": p.get('photos', []),
            })
            
        day_plans.append({
            "day_number": di + 1,
            "title": "",
            "description": "",
            "places": route_places,
        })
        
    # 3. LLM narrative creation
    narrative = await generate_narrative(profile.model_dump(), day_plans)
    
    title = narrative.get("title", "Маршрут по Краснодарскому краю")
    intro = narrative.get("intro", "")
    weather_desc = f"Погода: {weather.get('temp', 22)}°C, {weather.get('description', 'ясно')}."
    if intro:
        intro += " " + weather_desc
    else:
        intro = weather_desc
        
    for day in day_plans:
        for nd in narrative.get("days", []):
            if nd.get("day_number") == day["day_number"]:
                day["title"] = nd.get("title", day.get("title", ""))
                day["description"] = nd.get("description", day.get("description", ""))
                break

    share_token = uuid.uuid4().hex[:12]
    
    # Serialize to GeneratedRoute
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
            places=[RoutePlace(**p) for p in d["places"]]
        ) for d in day_plans],
        logistics=RouteLogistics(transport="Авто / Аренда", accommodation="Отель/Гостевой дом", food="Рекомендуемые рестораны")
    )
    
    _routes_cache[p_hash] = route
    _routes_cache[share_token] = route
    
    return route

def get_route_by_token(token: str) -> Optional[GeneratedRoute]:
    return _routes_cache.get(token)

