import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(override=True)

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_SERVICE_KEY", "")

# Error handling if keys absent (to allow app to start but fail cleanly on DB calls)
if not url or not key:
    import logging
    logging.warning("⚠️ SUPABASE_URL or SUPABASE_SERVICE_KEY not set")

supabase: Client = create_client(url, key) if url and key else None
