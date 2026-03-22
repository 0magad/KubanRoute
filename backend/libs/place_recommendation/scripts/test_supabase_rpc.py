"""
Тестирование RPC функций и миграций Supabase.
Запуск: python scripts/test_supabase_rpc.py
"""
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

root = Path(__file__).resolve().parent.parent
load_dotenv(root / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")


def test_rpc_find_similar_users():
    """Тестирует RPC функцию find_similar_users."""
    from supabase import create_client
    
    print("\n" + "=" * 70)
    print("RPC: find_similar_users (для collaborative filtering)")
    print("=" * 70)
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("✗ SUPABASE_URL или SUPABASE_KEY не заданы в .env")
        return
    
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # 1. Получим список пользователей
        print("\n1️⃣  Получаем список пользователей...")
        profiles = supabase.table("user_profiles").select("id, interests").execute()
        
        if not profiles.data:
            print("   ✗ Таблица user_profiles пустая!")
            return
        
        print(f"   ✓ Найдено пользователей: {len(profiles.data)}")
        
        # 2. Берем первого пользователя
        user_id = profiles.data[0].get("id")
        interests = profiles.data[0].get("interests", [])
        print(f"   Тестируем: {user_id}")
        print(f"   Интересы: {interests}")
        
        # 3. Вызываем RPC
        print("\n2️⃣  Вызываем RPC find_similar_users...")
        try:
            result = supabase.rpc(
                "find_similar_users",
                {
                    "user_id_input": user_id,
                    "similarity_threshold": 0.7
                }
            ).execute()
            
            similar_users = result.data if result.data else []
            print(f"   ✓ Похожих пользователей найдено: {len(similar_users)}")
            
            if similar_users:
                print(f"   Первый похожий пользователь: {similar_users[0]}")
            else:
                print("   ⚠ RPC вернула пустой результат")
                print("   Это может быть если:")
                print("     - В таблице only 1 пользователь")
                print("     - Нет пользователей с similarity >= 0.7")
                print("     - Нет данных для вычисления сходства")
        
        except Exception as rpc_error:
            print(f"   ✗ RPC ошибка: {rpc_error}")
            print("\n   Диагностика:")
            print("   1. Проверьте, что миграция 001_find_similar_users.sql применена:")
            print("      - Откройте Supabase Dashboard")
            print("      - SQL Editor → посмотрите 'find_similar_users'")
            print("   2. Если функции нет - примените миграцию:")
            print("      - Скопируйте код из supabase/migrations/001_find_similar_users.sql")
            print("      - Вставьте в SQL Editor и выполните")
    
    except Exception as e:
        print(f"✗ Ошибка подключения: {e}")


def test_user_profiles_table():
    """Проверяет таблицу user_profiles и ее структуру."""
    from supabase import create_client
    
    print("\n" + "=" * 70)
    print("Таблица user_profiles (для collaborative & profile filter)")
    print("=" * 70)
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("✗ SUPABASE_URL или SUPABASE_KEY не заданы в .env")
        return
    
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # 1. Информация о таблице
        print("\n1️⃣  Проверяем таблицу user_profiles...")
        result = supabase.table("user_profiles").select("*", count="exact").execute()
        
        count = len(result.data) if result.data else 0
        print(f"   ✓ Записей в таблице: {count}")
        
        if count == 0:
            print("   ⚠ Таблица пустая!")
            print("   Нужно добавить данные для testing:")
            print("""
   INSERT INTO user_profiles (id, interests, budget_tier, has_car, has_children)
   VALUES 
     ('user-1', ARRAY['hiking', 'nature'], 'mid', true, false),
     ('user-2', ARRAY['beach', 'swimming'], 'high', true, true),
     ('user-3', ARRAY['hiking', 'photography'], 'mid', false, false);
            """)
            return
        
        # 2. Показываем структуру
        print("\n2️⃣  Структура записи:")
        sample = result.data[0]
        for key, value in sample.items():
            print(f"   • {key}: {type(value).__name__} = {str(value)[:50]}")
        
        # 3. Проверяем наличие ratings
        print("\n3️⃣  Проверяем наличие оценок для collaborative...")
        try:
            ratings = supabase.table("ratings").select("*", count="exact").execute()
            rating_count = len(ratings.data) if ratings.data else 0
            print(f"   ✓ Оценок в таблице ratings: {rating_count}")
            if rating_count == 0:
                print("   ⚠ Таблица ratings пустая!")
                print("   Collaborative filtering не будет работать без оценок")
        except:
            print("   ⚠ Таблица ratings не найдена (это может быть нормально)")
    
    except Exception as e:
        print(f"✗ Ошибка: {e}")


def test_places_embeddings():
    """Проверяет наличие embeddings в таблице places."""
    from supabase import create_client
    
    print("\n" + "=" * 70)
    print("Таблица places (embeddings для content-based)")
    print("=" * 70)
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("✗ SUPABASE_URL или SUPABASE_KEY не заданы в .env")
        return
    
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        print("\n1️⃣  Получаем информацию о places...")
        result = supabase.table("places").select("*", count="exact").execute()
        
        if not result.data:
            print("   ✗ Таблица places пустая!")
            return
        
        count = len(result.data)
        print(f"   ✓ Записей: {count}")
        
        # Проверяем наличие embeddings
        print("\n2️⃣  Проверяем embeddings...")
        places_with_embeddings = sum(1 for p in result.data if p.get("embedding"))
        places_without_embeddings = count - places_with_embeddings
        
        print(f"   • С embeddings: {places_with_embeddings}/{count}")
        print(f"   • Без embeddings: {places_without_embeddings}/{count}")
        
        if places_without_embeddings > 0:
            print("\n   ⚠ Embeddings не заполнены для некоторых мест!")
            print("   Content-based scoring не будет работать без embeddings")
            print("   Нужно сгенерировать embeddings через OpenAI API")
        else:
            print("   ✓ Все места имеют embeddings")
        
        # Проверяем tags
        print("\n3️⃣  Проверяем tags...")
        places_with_tags = sum(1 for p in result.data if p.get("tags") and len(p["tags"]) > 0)
        print(f"   • С tags: {places_with_tags}/{count}")
        
        if places_with_tags < count:
            print("   ⚠ Некоторые места без tags!")
            print("   Content-based scoring будет работать хуже")
    
    except Exception as e:
        print(f"✗ Ошибка: {e}")


def main():
    print("\n" + "🔍" * 35)
    print("ДИАГНОСТИКА Supabase RPC И ТАБЛИЦ")
    print("🔍" * 35)
    
    test_places_embeddings()
    test_user_profiles_table()
    test_rpc_find_similar_users()
    
    print("\n" + "=" * 70)
    print("ИТОГО")
    print("=" * 70)
    print("""
Если что-то не работает:

1. ❌ RPC find_similar_users не существует
   → Примените миграцию: supabase/migrations/001_find_similar_users.sql

2. ❌ user_profiles пустая
   → Добавьте тестовые профили через INSERT

3. ❌ places без embeddings
   → Запустите скрипт генерации embeddings (нужен OpenAI API key)

4. ❌ places без tags
   → Заполните tags вручную или через скрипт seed
    """)


if __name__ == "__main__":
    main()
