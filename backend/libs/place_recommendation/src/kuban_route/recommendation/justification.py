"""LLM-обоснование рекомендации (OpenAI gpt-4o-mini)."""
from typing import Optional, Union

from ..config import OPENAI_API_KEY


JUSTIFICATION_PROMPT = """
Ты — персональный советник по путешествиям. Пишешь коротко и по-человечески.

Профиль пользователя:
- Тип поездки: {travel_style}
- Интересы: {interests}
- Бюджет: {budget}
- Есть машина: {has_car}
- Информация из диалога: {chat_summary}

Место: {place_name} (тип: {place_type})
Теги: {tags}
Рейтинг: {avg_rating} ({review_count} отзывов)
Погодный балл: {weather_score:.0%} — {weather_note}

Напиши 2-3 живых предложения: почему это место подходит именно этому пользователю.
Обращайся лично. Упомяни конкретное совпадение из профиля. Без клише и рекламы.
"""


async def generate_justification(
    place: Union[dict, "Place"],
    profile: Union[dict, "Profile"],
    weather_score: float,
    weather_note: str = "",
) -> str:
    """
    Генерирует короткое обоснование рекомендации через OpenAI.
    Возвращает текст обоснования или пустую строку при ошибке/отсутствии ключа.
    """
    if not OPENAI_API_KEY:
        return ""

    place_data = place.to_dict() if hasattr(place, "to_dict") else place
    profile_data = profile.to_dict() if hasattr(profile, "to_dict") else profile

    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=OPENAI_API_KEY)
        prompt = JUSTIFICATION_PROMPT.format(
            travel_style=profile_data.get("travel_style", "не указан"),
            interests=", ".join(profile_data.get("interests", []) or ["не указаны"]),
            budget=profile_data.get("budget_tier", "не указан"),
            has_car="да" if profile_data.get("has_car") else "нет",
            chat_summary=profile_data.get("chat_summary") or "нет",
            place_name=place_data.get("name", ""),
            place_type=place_data.get("type", ""),
            tags=", ".join(place_data.get("tags", []) or []),
            avg_rating=place_data.get("avg_rating", 0),
            review_count=place_data.get("review_count", 0),
            weather_score=weather_score,
            weather_note=weather_note or "данных нет",
        )

        r = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
            temperature=0.7,
        )
        return (r.choices[0].message.content or "").strip()
    except Exception:
        return ""
