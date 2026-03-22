# KubanRoute — рекомендательная система мест для отдыха

Система рекомендует места для отдыха на основе профиля пользователя по формуле:

```
SCORE(place, user, weather) =
  0.40 × content_score(place, user)        # совпадение интересов
+ 0.30 × collaborative_score(place, user)  # похожие пользователи
+ 0.20 × profile_filter(place, user)       # портрет (авто, дети, бюджет)
+ 0.10 × weather_score(place, weather, user)
```

Места с `SCORE < 0.1` не показываются. Все компоненты нормализованы в [0.0, 1.0].

## Структура проекта

```
KubanRoute/
├── src/kuban_route/
│   ├── config.py              # Конфигурация (Supabase, OpenAI, веса)
│   ├── models/
│   │   └── schemas.py         # Place, Profile, WeatherData
│   ├── db/
│   │   ├── client.py          # Supabase клиент
│   │   └── queries.py         # avg_rating_by_type, find_similar_users и др.
│   └── recommendation/
│       ├── core.py            # score_place, get_recommendations
│       ├── content.py         # content_score (40%)
│       ├── collaborative.py   # collaborative_score (30%)
│       ├── profile_filter.py  # profile_filter (20%)
│       ├── weather.py         # weather_score (10%)
│       └── justification.py   # LLM-обоснование (OpenAI gpt-4o-mini)
├── supabase/migrations/
│   ├── 001_find_similar_users.sql  # RPC для collaborative filtering
│   └── 002_user_profiles.sql       # Таблица профилей пользователей
├── requirements.txt
└── .env.example
```

## Установка

```bash
pip install -r requirements.txt
cp .env.example .env
# Заполните SUPABASE_URL, SUPABASE_KEY, OPENAI_API_KEY
```

## Миграции Supabase

Применить миграции:

```bash
supabase db push
```

Или выполнить SQL вручную в Supabase Dashboard → SQL Editor: скопировать содержимое файлов из `supabase/migrations/`.

## Ожидаемая схема БД (Supabase)

- **places** — id, name, type, tags, price_min, car_required, embedding, avg_rating, review_count
- **user_events** — user_id, place_id, event_type (`card_like`)
- **user_ratings** — user_id, place_id, rating (связь с places)
- **user_profiles** — id (user_id), interests, dislikes, has_car, has_children, budget_tier, travel_style, age_group, preference_vector, chat_summary

## Использование

```python
import asyncio
from kuban_route.recommendation import get_recommendations

places = [
    {"id": "1", "name": "Усадьба Семигорье", "type": "vineyard", "tags": ["wine", "couples", "child_friendly"]},
    # ...
]
profile = {
    "id": "user-123",
    "interests": ["wine", "nature"],
    "dislikes": [],
    "has_car": True,
    "budget_tier": "mid",
    "travel_style": "family",
}
weather = {"1": {"temperature": 22, "precipitation": 0}}

results = asyncio.run(get_recommendations(
    places, profile,
    weather_by_place=weather,
    top_k=10,
    include_justification=True
))
for r in results:
    print(r["place"]["name"], r["score"], r.get("justification", ""))
```

## Без Supabase (тесты)

Если БД недоступна, `find_similar_users` и остальные запросы вызовут ошибку. Для изоляции в тестах можно подменить `db.queries` моками или использовать in-memory реализацию.
