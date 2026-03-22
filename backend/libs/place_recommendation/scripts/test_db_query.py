"""
Диагностика запросов к Supabase.
Проверяет places и user_profiles, делает raw HTTP запрос.
Запуск: python scripts/test_db_query.py
"""
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

root = Path(__file__).resolve().parent.parent
load_dotenv(root / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


def mask_key(k: str) -> str:
    if not k or len(k) < 8:
        return "***"
    return f"{k[:8]}...{k[-4:]}" if len(k) > 12 else "***"


def test_raw_http(table: str, key: str, key_name: str) -> dict | None:
    """Прямой HTTP запрос к PostgREST API."""
    import urllib.request
    url = f"{SUPABASE_URL}/rest/v1/{table}?select=*"
    req = urllib.request.Request(
        url,
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            import json
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"  HTTP ошибка: {e}")
        return None


def main():
    print("=== Диагностика Supabase ===\n")
    print(f"URL: {SUPABASE_URL or '(не задан)'}")
    print(f"SUPABASE_KEY: {mask_key(SUPABASE_KEY)}")
    print(f"SUPABASE_SERVICE_ROLE_KEY: {'задан' if SUPABASE_SERVICE_KEY else '(не задан)'}")
    print()

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Ошибка: задайте SUPABASE_URL и SUPABASE_KEY в .env")
        return 1

    # 1. Raw HTTP — обходим Python-клиент
    print("--- Raw HTTP (PostgREST) ---")
    for table in ["places", "user_profiles"]:
        print(f"\nGET /rest/v1/{table}?select=*")
        data = test_raw_http(table, SUPABASE_KEY, "anon")
        if data is not None:
            count = len(data) if isinstance(data, list) else "?."
            print(f"  Записей: {count}")
            if isinstance(data, list) and data:
                print(f"  Первая запись: {list(data[0].keys())}")
        else:
            print("  Не удалось получить данные")
    print()

    # 2. Пробуем service_role, если есть
    if SUPABASE_SERVICE_KEY:
        print("--- Raw HTTP (service_role) ---")
        for table in ["places", "user_profiles"]:
            print(f"\nGET /rest/v1/{table}?select=* [service_role]")
            data = test_raw_http(table, SUPABASE_SERVICE_KEY, "service_role")
            if data is not None:
                count = len(data) if isinstance(data, list) else "?"
                print(f"  Записей: {count}")
                if isinstance(data, list) and data:
                    print(f"  Первая запись: {list(data[0].keys())}")
        print()

    # 3. Python-клиент Supabase
    print("--- Supabase Python client ---")
    try:
        from supabase import create_client
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        for table in ["places", "user_profiles"]:
            r = supabase.table(table).select("*").execute()
            n = len(r.data) if r and r.data else 0
            print(f"  {table}: {n} записей")
    except Exception as e:
        print(f"  Ошибка: {e}")

    print("\n--- Что проверить ---")
    print("1. В Dashboard → Table Editor вы видите строки в places / user_profiles?")
    print("2. URL в .env совпадает с проектом в Dashboard?")
    print("3. Ключ anon или service_role? service_role обходит RLS.")
    print("4. В Dashboard → SQL Editor выполните: SELECT COUNT(*) FROM places;")
    return 0


if __name__ == "__main__":
    sys.exit(main())
