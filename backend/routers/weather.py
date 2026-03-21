from fastapi import APIRouter, Query
from services.weather import get_weather

router = APIRouter()

@router.get("/api/weather")
async def fetch_weather(
    region: str = Query("Краснодар", description="Region name in Russian")
):
    """Get current weather from OpenWeatherMap API with 3-hour cache."""
    return await get_weather(region)
