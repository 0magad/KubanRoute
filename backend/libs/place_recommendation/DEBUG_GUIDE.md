# Отладка place_recommendation — Полное руководство

## 📋 Структура тестирования

### Уровень 1: Проверка конфигурации
```bash
# 1. Убедитесь, что .env заполнен
ls backend/libs/place_recommendation/.env

# 2. Установите library в режиме разработки
cd backend/libs/place_recommendation
pip install -e ".[dev]"
```

### Уровень 2: Диагностика БД
```bash
# Проверяет соединение с Supabase и наличие таблиц
python scripts/test_db_query.py
```

**Ожидаемый вывод:**
```
--- Raw HTTP (PostgREST) ---
GET /rest/v1/places?select=*
  Записей: 42      ← должно быть > 0
  Первая запись: ['id', 'name', 'type', 'tags', ...]

GET /rest/v1/user_profiles?select=*
  Записей: 5       ← должно быть > 0
```

### Уровень 3: Проверка рекомендаций с логированием
```bash
python scripts/debug_recommendations.py
```

**Ожидаемый вывод:**
```
ОТЛАДКА РЕКОМЕНДАЦИЙ
======================================================================

📥 Загрузка данных из Supabase...
   ✓ Загружено 42 мест
   ✓ Профиль: ['hiking', 'photography']

📊 Подробные оценки (первые 5 мест):
------
1. Гора Ахун                     
   ID: 3f4a...
   Оценки компонентов:
      Content (40%)       : 0.850
      Collaborative (30%) : 0.420
      Profile (20%)       : 0.600
      Weather (10%)       : 0.500
      ---------
      ИТОГО SCORE         : 0.620 ✓ (показывается)

2. Озеро Сукко                   
   ID: 5e2b...
   ...
```

### Уровень 4: Отладка einzelных компонентов

Если нет рекомендаций, каждый компонент может быть проблемой:

#### A) Content-based (совпадение интересов)
```python
# В scripts/test_content.py
from kuban_route.recommendation.content import content_score
import asyncio

async def test():
    place = {"name": "Гора Ахун", "tags": ["hiking", "scenic"], ...}
    profile = {"interests": ["hiking", "photography"]}
    score = await content_score(place, profile)
    print(f"Content score: {score:.3f}")  # должно быть 0.5-1.0

asyncio.run(test())
```

#### B) Collaborative filtering (похожие пользователи)
```python
# Проверяет RPC find_similar_users
from supabase import create_client
import os

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
result = supabase.rpc("find_similar_users", {
    "user_id_input": "some-uuid",
    "similarity_threshold": 0.7
}).execute()

print(f"Похожих пользователей найдено: {len(result.data)}")
# Если 0 → нужно проверить миграции и данные в user_profiles
```

#### C) Profile filter (портрет + бюджет)
```python
from kuban_route.recommendation.profile_filter import profile_filter

place = {"price_min": 500, "has_car_required": True, ...}
profile = {"budget_tier": "low", "has_car": False, ...}
score = profile_filter(place, profile)
print(f"Profile filter score: {score:.3f}")  # должно быть 0-1
```

## 🔍 Типичные проблемы и решения

| Проблема | Признак | Решение |
|----------|---------|---------|
| **БД не подключена** | `test_db_query.py` выдает ошибку соединения | Проверьте SUPABASE_URL, SUPABASE_KEY в .env |
| **Таблицы пустые** | `test_db_query.py` показывает 0 записей | Запустите `supabase_migrations.sql` и `seed_places.sql` |
| **Нет рекомендаций** | `debug_recommendations.py` выдает пустой список | Скорее всего все места имеют score < 0.1. Проверьте уровень 4 выше |
| **Embeddings не заполнены** | `content_score` всегда возвращает 0 | Нужно сгенерировать embeddings для мест (OpenAI) |
| **RPC find_similar_users ошибается** | Collaborative score всегда 0.5 | Проверьте миграцию `001_find_similar_users.sql` в Supabase |
| **Очень низкие scores** | Все места < 0.1 | Возможно профиль интересов не совпадает с местами. Проверьте tags в places |

## 💡 Быстрая отладка через backend

Если вы хотите видеть логи при вызове из FastAPI:

```python
# В backend/routers/recommendations.py добавьте:
import logging

logger = logging.getLogger(__name__)

@router.get("/recommendations")
async def get_recommendations_endpoint(user_id: str):
    logger.info(f"Запрос рекомендаций для {user_id}")
    
    from services.recommendation_service import get_recommendations_for_user
    results = await get_recommendations_for_user(user_id)
    
    logger.debug(f"Получено {len(results)} рекомендаций")
    for r in results:
        logger.debug(f"  {r['place']['name']}: {r['score']:.3f}")
    
    return results
```

Затем запустите backend с логами:
```bash
LOG_LEVEL=DEBUG python backend/main.py
```

## 🧪 Интерактивная отладка (Python REPL)

```bash
cd backend/libs/place_recommendation
python
```

```python
import asyncio, os
from dotenv import load_dotenv
load_dotenv(".env")

from kuban_route.db import fetch_places, fetch_first_profile
from kuban_route.recommendation import get_recommendations

async def test():
    places = await fetch_places()
    profile = await fetch_first_profile()
    print(f"Places: {len(places)}, Profile: {profile['interests']}")
    
    results = await get_recommendations(places, profile, top_k=5)
    for r in results:
        print(f"{r['place']['name']}: {r['score']:.3f}")

asyncio.run(test())
```

