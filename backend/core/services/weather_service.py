import os
import httpx
from datetime import datetime
from core.services.db import supabase

REGIONS = {
    "Краснодар":    (45.0355, 38.9753),
    "Сочи":         (43.5992, 39.7257),
    "Геленджик":    (44.5616, 38.0766),
    "Новороссийск": (44.7233, 37.7694),
    "Анапа":        (44.8947, 37.3159),
    "Темрюк":       (45.2744, 37.3879),
    "Абрау-Дюрсо":  (44.6900, 37.6800),
    "Туапсе":       (44.1059, 39.0849),
}

OWM_KEY = os.environ.get("OPENWEATHERMAP_API_KEY", "")

async def get_weather(region: str = "Краснодар") -> dict:
    if not supabase:
        return {"temp": 25, "feels_like": 25, "is_raining": False, "is_snowing": False} # fallback mocking

    # 1. Проверить кэш (3 часа)
    try:
        response = supabase.table('weather_cache').select('data').eq('region', region).gt('expires_at', 'NOW()').maybe_single().execute()
        if response.data:
            return response.data['data']
    except Exception as e:
        print(f"Error reading weather cache: {e}")

    # 2. OpenWeatherMap API
    lat, lon = REGIONS.get(region, REGIONS['Краснодар'])
    if not OWM_KEY:
        # Mock weather if NO KEY
        weather_mock = {
            'temp':        22.5,
            'feels_like':  24.0,
            'humidity':    60,
            'wind_speed':  3.5,
            'condition':   'Clear',
            'description': 'ясно',
            'icon':        '01d',
            'is_raining':  False,
            'is_snowing':  False,
            'is_foggy':    False,
            'month':       datetime.now().month,
        }
        return weather_mock

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            'https://api.openweathermap.org/data/2.5/weather',
            params={'lat':lat,'lon':lon,'appid':OWM_KEY,'units':'metric','lang':'ru'}
        )
    
    if resp.status_code != 200:
        return {"temp": 20, "feels_like": 20, "is_raining": False, "is_snowing": False}
        
    raw = resp.json()
    cond = raw['weather'][0]['main']
 
    weather = {
        'temp':        round(raw['main']['temp'], 1),
        'feels_like':  round(raw['main']['feels_like'], 1),
        'humidity':    raw['main']['humidity'],
        'wind_speed':  raw['wind']['speed'],
        'condition':   cond,
        'description': raw['weather'][0]['description'],
        'icon':        raw['weather'][0]['icon'],
        'is_raining':  cond in ['Rain','Drizzle','Thunderstorm'],
        'is_snowing':  cond == 'Snow',
        'is_foggy':    cond in ['Mist','Fog','Haze'],
        'month':       datetime.now().month,
    }
 
    # 3. Кэшировать на 3 часа
    try:
        supabase.table('weather_cache').upsert({'region':region,'data':weather}).execute()
    except Exception as e:
        print(f"Error caching weather: {e}")
        
    return weather
