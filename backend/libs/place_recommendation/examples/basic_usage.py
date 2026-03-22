"""
Пример использования рекомендательной системы с Supabase.
Загружает места и профиль из БД, считает рекомендации.
"""
import asyncio
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root / "src"))
load_dotenv(root / ".env")


async def main():
    from kuban_route.db import fetch_first_profile, fetch_places, fetch_profile
    from kuban_route.recommendation import get_recommendations

    user_id = os.getenv("DEMO_USER_ID")

    print("Загрузка данных из Supabase...")
    places = await fetch_places()
    if user_id:
        profile = await fetch_profile(user_id)
    else:
        profile = await fetch_first_profile()

    if not places:
        print("Ошибка: в таблице places нет данных.")
        return

    if not profile:
        print(
            "Профиль не найден. Создайте запись в user_profiles "
            "или задайте DEMO_USER_ID=uuid в .env"
        )
        return

    profile["id"] = profile.get("id") or user_id

    # Погоду можно передать из внешнего API; по умолчанию — пусто (weather_score = 0.5)
    weather_by_place: dict[str, dict] = {}

    results = await get_recommendations(
        places,
        profile,
        weather_by_place=weather_by_place,
        top_k=10,
        include_justification=bool(os.getenv("OPENAI_API_KEY")),
    )

    print(f"Рекомендации для {profile.get('interests', [])}:\n")
    for r in results:
        comp = r["components"]
        print(f"  {r['place'].get('name', 'Без названия')}")
        print(f"    SCORE: {r['score']:.2f} (content={comp['content']:.2f}, collab={comp['collaborative']:.2f}, profile={comp['profile']:.2f}, weather={comp['weather']:.2f})")
        if r.get("justification"):
            print(f"    {r['justification']}")
        print()


if __name__ == "__main__":
    asyncio.run(main())
