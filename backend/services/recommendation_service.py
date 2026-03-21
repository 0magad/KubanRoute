import json
from datetime import datetime
from services.db import supabase
from services.weather import get_weather
from services.places_service import get_all_places
from config import OPENAI_API_KEY
import httpx

def weather_score(place: dict, weather: dict, profile: dict) -> float:
    temp        = weather.get('temp', 20)
    feels_like  = weather.get('feels_like', 20)
    is_raining  = weather.get('is_raining', False)
    is_snowing  = weather.get('is_snowing', False)
    is_outdoor  = place.get('outdoor', True)
    w_sensitive = place.get('weather_sensitive', True)
    month       = weather.get('month', datetime.now().month)
    user_pref   = profile.get('weather_preference', 'any')
    min_comfort = profile.get('min_temp_comfort', 10)
 
    if user_pref == 'indoor_only':
        return 0.9 if not is_outdoor else 0.3
 
    if not is_outdoor or not w_sensitive:
        if is_raining or is_snowing or feels_like < 5:
            return 0.95
        return 0.80
 
    score = 1.0
 
    # Температурный комфорт
    if feels_like < min_comfort:
        penalty = (min_comfort - feels_like) / 20.0
        score  -= min(penalty, 0.75)
    elif feels_like > 37:
        penalty = (feels_like - 37) / 15.0
        score  -= min(penalty, 0.50)
    elif 17 <= feels_like <= 27:
        score  += 0.10
 
    # Осадки
    if is_raining:
        score -= 0.50
    if is_snowing:
        if 'winter_activity' in place.get('tags', []):
            score += 0.20
        else:
            score -= 0.60
 
    # Ветер 
    if weather.get('wind_speed', 0) > 15:
        if any(t in place.get('tags', []) for t in ['hiking','beach','festival']):
            score -= 0.20
 
    # Сезонность
    seasons = place.get('seasons', [])
    if seasons and month not in seasons:
        score -= 0.30
 
    if user_pref == 'warm' and feels_like < 20:
        score -= 0.20
    if user_pref == 'cold' and feels_like > 25:
        score -= 0.20
 
    return max(0.0, min(1.0, score))


async def content_score(place: dict, profile: dict) -> float:
    place_tags    = set(place.get('tags', []))
    user_interests = set(profile.get('interests', []))
    user_dislikes  = set(profile.get('dislikes', []))
 
    if place_tags & user_dislikes:
        return 0.0
 
    if not (place_tags | user_interests):
        return 0.1
    jaccard = len(place_tags & user_interests) / len(place_tags | user_interests)
 
    return min(jaccard * 0.45 + 0.3, 1.0) # Simplified mock without embedding math for speed


async def collaborative_score(place_id: str, user_id: str) -> float:
    # Simplified mock - assume 0.5 average collaborative filtering due to lack of SQL RPC fn
    return 0.5


def profile_filter(place: dict, profile: dict) -> float:
    score = 1.0
    if profile.get('has_car') is False and place.get('car_required'):
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
    if ts in ('solo','remote_workers') and 'remote_workers' in tags:
        score *= 1.3
 
    return min(score, 1.0)


async def generate_justification(place: dict, profile: dict, weather_score_val: float, weather: dict) -> str:
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
        print(f"Justification failed: {e}")
        return "Отличное место для вашего сценария."


async def get_top_recommendations(user_id: str, limit: int = 5) -> dict:
    profile = {}
    if supabase:
        try:
            profile_res = supabase.table('user_profiles').select('*').eq('id', user_id).maybe_single().execute()
            if profile_res.data:
                profile = profile_res.data
        except:
            pass
            
    # Mock fallback profile if user not found
    if not profile:
        profile = {"interests": ["wine", "nature"], "travel_style": "couple", "budget_tier": "mid"}
        
    weather = await get_weather("Краснодар")
    places = get_all_places()
    
    scored_places = []
    for p in places:
        # Pydantic model to dict
        p_dict = p.model_dump()
        
        c_score = await content_score(p_dict, profile)
        col_score = await collaborative_score(str(p.id), user_id)
        p_filter = profile_filter(p_dict, profile)
        w_score = weather_score(p_dict, weather, profile)
        
        total_score = (0.4 * c_score) + (0.3 * col_score) + (0.2 * p_filter) + (0.1 * w_score)
        
        if total_score >= 0.1:
            scored_places.append({
                "place": p_dict,
                "score": total_score,
                "weather_score": w_score
            })
            
    scored_places.sort(key=lambda x: x["score"], reverse=True)
    top_candidates = scored_places[:limit]
    
    justifications = {}
    scores = {}
    for c in top_candidates:
        pid = str(c["place"]["id"])
        scores[pid] = c["score"]
        justifications[pid] = await generate_justification(c["place"], profile, c["weather_score"], weather)
        
    return {
        "user_id": user_id,
        "places": [c["place"] for c in top_candidates],
        "justifications": justifications,
        "scores": scores,
        "weather": weather
    }
