"""
Отладка рекомендаций с подробным логированием всех компонентов.
Запуск: python scripts/debug_recommendations.py
"""
import asyncio
import os
import sys
import json
from pathlib import Path

from dotenv import load_dotenv

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root / "src"))
load_dotenv(root / ".env")


async def main():
    from kuban_route.db import fetch_first_profile, fetch_places, fetch_profile
    from kuban_route.recommendation.core import score_place
    from kuban_route.recommendation import get_recommendations

    user_id = os.getenv("DEMO_USER_ID")

    print("=" * 70)
    print("ОТЛАДКА РЕКОМЕНДАЦИЙ")
    print("=" * 70)
    print()

    # 1. Загрузка данных
    print("📥 Загрузка данных из Supabase...")
    try:
        places = await fetch_places()
        if user_id:
            profile = await fetch_profile(user_id)
        else:
            profile = await fetch_first_profile()
        print(f"   ✓ Загружено {len(places)} мест")
        print(f"   ✓ Профиль: {profile.get('interests', [])}")
    except Exception as e:
        print(f"   ✗ Ошибка загрузки: {e}")
        return 1

    if not places:
        print("   ✗ Таблица places пустая!")
        return 1

    if not profile:
        print("   ✗ Профиль не найден. Создайте запись в user_profiles")
        return 1

    profile["id"] = profile.get("id") or user_id
    print()

    # 2. Детальное логирование для каждого места
    print("📊 Подробные оценки (первые 5 мест):")
    print("-" * 70)
    
    for i, place in enumerate(places[:5]):
        place_name = place.get("name", "Без названия").ljust(30)
        print(f"\n{i+1}. {place_name}")
        print(f"   ID: {place.get('id')}")
        
        try:
            scores = await score_place(place, profile, weather=None)
            
            print(f"   Оценки компонентов:")
            print(f"      Content (40%)       : {scores['content']:.3f}")
            print(f"      Collaborative (30%) : {scores['collaborative']:.3f}")
            print(f"      Profile (20%)       : {scores['profile']:.3f}")
            print(f"      Weather (10%)       : {scores['weather']:.3f}")
            print(f"      " + "-" * 35)
            print(f"      ИТОГО SCORE         : {scores['total']:.3f} ", end="")
            
            if scores['total'] >= 0.1:
                print("✓ (показывается)")
            else:
                print("✗ (отфильтровано, < 0.1)")
                
        except Exception as e:
            print(f"   ✗ Ошибка расчета: {e}")
    
    print()
    print("-" * 70)

    # 3. Полный список рекомендаций
    print()
    print("🎯 Финальные рекомендации (топ 10):")
    print("-" * 70)
    
    try:
        weather_by_place = {}
        results = await get_recommendations(
            places,
            profile,
            weather_by_place=weather_by_place,
            top_k=10,
            include_justification=False,  # отключим обоснование для отладки
        )
        
        if not results:
            print("   ⚠ Нет рекомендаций (все места отфильтрованы)")
        else:
            for idx, r in enumerate(results, 1):
                place_name = r['place'].get('name', 'Без названия')
                score = r['score']
                comp = r['components']
                print(f"\n{idx}. {place_name}")
                print(f"   Score: {score:.3f}")
                print(f"   Компоненты: C={comp['content']:.3f} + "
                      f"Co={comp['collaborative']:.3f} + "
                      f"P={comp['profile']:.3f} + "
                      f"W={comp['weather']:.3f}")
    except Exception as e:
        print(f"   ✗ Ошибка получения рекомендаций: {e}")
        import traceback
        traceback.print_exc()
    
    print()
    print("=" * 70)
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
