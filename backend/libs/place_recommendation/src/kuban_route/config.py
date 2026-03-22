"""Конфигурация приложения."""
import os
from pathlib import Path

from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Порог для показа мест
SCORE_THRESHOLD = 0.1

# Веса компонентов в итоговой формуле
WEIGHT_CONTENT = 0.40
WEIGHT_COLLABORATIVE = 0.30
WEIGHT_PROFILE = 0.20
WEIGHT_WEATHER = 0.10
