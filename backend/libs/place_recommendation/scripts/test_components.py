"""
Тестирование компонентов отдельно для отладки.
Запуск: python scripts/test_components.py
"""
import asyncio
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root / "src"))
load_dotenv(root / ".env")


async def test_content_score():
    """Тестирует компонент совпадения интересов (content-based)."""
    from kuban_route.recommendation.content import content_score
    
    print("\n" + "=" * 60)
    print("1️⃣  CONTENT-BASED SCORING (40% веса)")
    print("=" * 60)
    print("Проверяет совпадение интересов пользователя с tags места")
    
    test_cases = [
        {
            "place": {
                "id": "1",
                "name": "Гора Ахун",
                "tags": ["hiking", "scenic", "nature"],
                "type": "landmark"
            },
            "profile": {
                "interests": ["hiking", "photography"],
                "dislikes": ["crowded"]
            },
            "expected": "высокий (hiking совпадает)",
        },
        {
            "place": {
                "id": "2",
                "name": "Ночной клуб",
                "tags": ["nightlife", "party"],
                "type": "entertainment"
            },
            "profile": {
                "interests": ["hiking", "photography"],
                "dislikes": []
            },
            "expected": "низкий (no match)",
        },
    ]
    
    for i, tc in enumerate(test_cases, 1):
        try:
            score = await content_score(tc["place"], tc["profile"])
            print(f"\nТест {i}: {tc['place']['name']}")
            print(f"  Интересы: {tc['profile']['interests']}")
            print(f"  Tags места: {tc['place'].get('tags', [])} ")
            print(f"  Ожидается: {tc['expected']}")
            print(f"  Результат: {score:.3f} ", end="")
            if score > 0.7:
                print("✓ (высокий)")
            elif score > 0.3:
                print("⚠ (средний)")
            else:
                print("✗ (низкий)")
        except Exception as e:
            print(f"\nТест {i}: ✗ Ошибка: {e}")


def test_profile_filter():
    """Тестирует компонент портрета пользователя (profile filter)."""
    from kuban_route.recommendation.profile_filter import profile_filter
    
    print("\n" + "=" * 60)
    print("2️⃣  PROFILE FILTER (20% веса)")
    print("=" * 60)
    print("Проверяет совместимость места с портретом (авто, дети, бюджет)")
    
    test_cases = [
        {
            "place": {
                "price_min": 500,
                "price_max": 2000,
                "has_car_required": False,
                "kid_friendly": True,
            },
            "profile": {
                "budget_tier": "mid",
                "has_car": False,
                "has_children": False,
            },
            "expected": "высокий (совместим)",
        },
        {
            "place": {
                "price_min": 3000,
                "price_max": 5000,
                "has_car_required": True,
                "kid_friendly": False,
            },
            "profile": {
                "budget_tier": "low",
                "has_car": False,
                "has_children": True,
            },
            "expected": "низкий (несовместим)",
        },
    ]
    
    for i, tc in enumerate(test_cases, 1):
        try:
            score = profile_filter(tc["place"], tc["profile"])
            print(f"\nТест {i}:")
            print(f"  Место: цена {tc['place']['price_min']}-{tc['place']['price_max']}, "
                  f"car={tc['place']['has_car_required']}")
            print(f"  Профиль: бюджет={tc['profile']['budget_tier']}, "
                  f"car={tc['profile']['has_car']}")
            print(f"  Ожидается: {tc['expected']}")
            print(f"  Результат: {score:.3f} ", end="")
            if score > 0.7:
                print("✓ (высокий)")
            elif score > 0.3:
                print("⚠ (средний)")
            else:
                print("✗ (низкий)")
        except Exception as e:
            print(f"\nТест {i}: ✗ Ошибка: {e}")


def test_weather_score():
    """Тестирует компонент погоды (10% веса)."""
    from kuban_route.recommendation.weather import weather_score
    
    print("\n" + "=" * 60)
    print("3️⃣  WEATHER SCORING (10% веса)")
    print("=" * 60)
    print("Проверяет совместимость место с условиями погоды")
    
    test_cases = [
        {
            "place": {
                "name": "Пляж",
                "outdoor": True,
                "weather_sensitive": True,
            },
            "weather": {
                "temperature": 25,
                "precipitation": 0,
                "description": "sunny"
            },
            "profile": {"weather_preference": "any"},
            "expected": "высокий (sunny day + beach)",
        },
        {
            "place": {
                "name": "Пещера",
                "outdoor": False,
                "weather_sensitive": False,
            },
            "weather": {
                "temperature": 5,
                "precipitation": 10,
                "description": "rainy"
            },
            "profile": {"weather_preference": "any"},
            "expected": "высокий (indoor место)",
        },
    ]
    
    for i, tc in enumerate(test_cases, 1):
        try:
            score = weather_score(tc["place"], tc["weather"], tc["profile"])
            print(f"\nТест {i}:")
            print(f"  Место: outdoor={tc['place'].get('outdoor', 'N/A')}")
            print(f"  Погода: temp={tc['weather']['temperature']}°, "
                  f"rain={tc['weather']['precipitation']}mm")
            print(f"  Ожидается: {tc['expected']}")
            print(f"  Результат: {score:.3f} ", end="")
            if score > 0.7:
                print("✓ (высокий)")
            elif score > 0.3:
                print("⚠ (средний)")
            else:
                print("✗ (низкий)")
        except Exception as e:
            print(f"\nТест {i}: ✗ Ошибка: {e}")


async def test_collaborative_score():
    """Тестирует collaborative filtering (30% веса)."""
    from kuban_route.recommendation.collaborative import collaborative_score
    
    print("\n" + "=" * 60)
    print("4️⃣  COLLABORATIVE FILTERING (30% веса)")
    print("=" * 60)
    print("Проверяет: похожие пользователи оценили это место высоко?")
    print("Требует: миграция 001_find_similar_users.sql + данные в user_profiles")
    
    try:
        # Попробуем вычислить для тестового ID
        score = await collaborative_score(
            place_id="test-place-1",
            user_id="test-user-1",
            place={"id": "test-place-1", "name": "Test"}
        )
        print(f"\nРезультат: {score:.3f}")
        if score > 0.5:
            print("✓ Collaborative filtering работает")
        else:
            print("⚠ Возможно, нет похожих пользователей в БД")
    except Exception as e:
        print(f"\n✗ Ошибка: {e}")
        print("\nДиагностика:")
        print("- Проверьте, что миграция 001_find_similar_users.sql применена")
        print("- Проверьте, есть ли записи в таблице user_profiles")
        print("- Проверьте, есть ли рейтинги мест в таблице ratings")


async def main():
    print("\n" + "🔧" * 30)
    print("КОМПОНЕНТНОЕ ТЕСТИРОВАНИЕ place_recommendation")
    print("🔧" * 30)
    
    await test_content_score()
    test_profile_filter()
    test_weather_score()
    await test_collaborative_score()
    
    print("\n" + "=" * 60)
    print("ИТОГО")
    print("=" * 60)
    print("""
Если вы видите ошибки или низкие scores:
1. Content ✗  → проверьте tags в таблице places и interests в профиле
2. Profile ✗  → проверьте price и car_required в places
3. Weather ✗  → это нормально если weather_data не передана
4. Collaborative ✗  → проверьте миграции и user_profiles в Supabase
    """)


if __name__ == "__main__":
    asyncio.run(main())
