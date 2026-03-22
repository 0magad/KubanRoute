"""Supabase клиент."""
from typing import TYPE_CHECKING, Optional

from ..config import SUPABASE_KEY, SUPABASE_URL

if TYPE_CHECKING:
    from supabase import Client

_supabase: Optional["Client"] = None


def get_supabase() -> "Client":
    """Получить клиент Supabase (singleton)."""
    global _supabase
    if _supabase is None:
        from supabase import Client, create_client
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise RuntimeError(
                "SUPABASE_URL и SUPABASE_KEY должны быть заданы в .env"
            )
        _supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supabase
