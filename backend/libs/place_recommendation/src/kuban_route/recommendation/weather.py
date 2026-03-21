"""Weather Score (10%)."""
from typing import Optional, Union


def weather_score(
    place: Union[dict, "Place"],
    weather: Union[dict, "WeatherData"] | None,
    profile: Union[dict, "Profile"] | None = None,
) -> float:
    """
    Погодный компонент. Нормализован в [0.0, 1.0].
    Без погодных данных возвращает нейтральное значение 0.5.
    """
    if not weather:
        return 0.5

    w = weather.to_dict() if hasattr(weather, "to_dict") else weather
    score = 0.5

    # Температура: комфортный диапазон 18–28 °C
    temp = w.get("temperature")
    if temp is not None:
        if 20 <= temp <= 26:
            score += 0.3
        elif 15 <= temp < 20 or 26 < temp <= 30:
            score += 0.15
        elif temp < 5 or temp > 35:
            score -= 0.3

    # Осадки
    precip = w.get("precipitation")
    if precip is not None:
        if precip < 0.1:
            score += 0.2
        elif precip > 5:
            score -= 0.3

    return max(0.0, min(1.0, score))
