"""Схемы данных для рекомендательной системы."""
from typing import Any, Optional


class Place:
    """Место для отдыха."""

    def __init__(
        self,
        id: str,
        name: str,
        place_type: str,
        tags: list[str],
        price_min: Optional[float] = None,
        car_required: bool = False,
        embedding: Optional[list[float]] = None,
        avg_rating: float = 0.0,
        review_count: int = 0,
        **kwargs: Any,
    ):
        self.id = id
        self.name = name
        self.type = place_type
        self.tags = tags or []
        self.price_min = price_min or 0
        self.car_required = car_required
        self.embedding = embedding
        self.avg_rating = avg_rating
        self.review_count = review_count
        self._extra = kwargs

    def to_dict(self) -> dict:
        """Преобразование в словарь (для совместимости с dict-ориентированным API)."""
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "tags": self.tags,
            "price_min": self.price_min,
            "car_required": self.car_required,
            "embedding": self.embedding,
            "avg_rating": self.avg_rating,
            "review_count": self.review_count,
            **self._extra,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "Place":
        """Создание из словаря."""
        return cls(
            id=d["id"],
            name=d.get("name", ""),
            place_type=d.get("type", ""),
            tags=d.get("tags", []),
            price_min=d.get("price_min"),
            car_required=d.get("car_required", False),
            embedding=d.get("embedding"),
            avg_rating=d.get("avg_rating", 0),
            review_count=d.get("review_count", 0),
            **{k: v for k, v in d.items() if k not in ("id", "name", "type", "tags", "price_min", "car_required", "embedding", "avg_rating", "review_count")},
        )


class Profile:
    """Профиль пользователя."""

    def __init__(
        self,
        id: str,
        interests: Optional[list[str]] = None,
        dislikes: Optional[list[str]] = None,
        has_car: Optional[bool] = None,
        has_children: bool = False,
        budget_tier: Optional[str] = None,
        travel_style: Optional[str] = None,
        age_group: Optional[str] = None,
        preference_vector: Optional[list[float]] = None,
        chat_summary: Optional[str] = None,
        **kwargs: Any,
    ):
        self.id = id
        self.interests = interests or []
        self.dislikes = dislikes or []
        self.has_car = has_car
        self.has_children = has_children
        self.budget_tier = budget_tier  # 'low' | 'mid' | 'high'
        self.travel_style = travel_style  # 'couple' | 'family' | 'solo' | 'remote_workers'
        self.age_group = age_group  # 'senior' | 'adult' | 'young'
        self.preference_vector = preference_vector
        self.chat_summary = chat_summary
        self._extra = kwargs

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "interests": self.interests,
            "dislikes": self.dislikes,
            "has_car": self.has_car,
            "has_children": self.has_children,
            "budget_tier": self.budget_tier,
            "travel_style": self.travel_style,
            "age_group": self.age_group,
            "preference_vector": self.preference_vector,
            "chat_summary": self.chat_summary,
            **self._extra,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "Profile":
        known = {"id", "interests", "dislikes", "has_car", "has_children", "budget_tier", "travel_style", "age_group", "preference_vector", "chat_summary"}
        extra = {k: v for k, v in d.items() if k not in known}
        return cls(
            id=d["id"],
            interests=d.get("interests"),
            dislikes=d.get("dislikes"),
            has_car=d.get("has_car"),
            has_children=d.get("has_children", False),
            budget_tier=d.get("budget_tier"),
            travel_style=d.get("travel_style"),
            age_group=d.get("age_group"),
            preference_vector=d.get("preference_vector"),
            chat_summary=d.get("chat_summary"),
            **extra,
        )


class WeatherData:
    """Погодные данные для места."""

    def __init__(
        self,
        place_id: str,
        temperature: Optional[float] = None,
        conditions: Optional[str] = None,
        precipitation: Optional[float] = None,
        **kwargs: Any,
    ):
        self.place_id = place_id
        self.temperature = temperature
        self.conditions = conditions
        self.precipitation = precipitation
        self._extra = kwargs

    def to_dict(self) -> dict:
        return {
            "place_id": self.place_id,
            "temperature": self.temperature,
            "conditions": self.conditions,
            "precipitation": self.precipitation,
            **self._extra,
        }
