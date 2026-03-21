"""
Yandex Cloud SpeechKit TTS (REST v1): https://cloud.yandex.ru/docs/speechkit/tts/
"""

import logging
from typing import Optional

import httpx

from config import (
    ENABLE_ROUTE_AUDIO_TTS,
    YANDEX_CLOUD_FOLDER_ID,
    YANDEX_SPEECHKIT_API_KEY,
    YANDEX_SPEECHKIT_FORMAT,
    YANDEX_SPEECHKIT_IAM_TOKEN,
    YANDEX_SPEECHKIT_VOICE,
)

logger = logging.getLogger(__name__)

TTS_URL = "https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize"

# Map format -> media type for HTTP responses
_FORMAT_MEDIA_TYPES = {
    "mp3": "audio/mpeg",
    "oggopus": "audio/ogg",
    "lpcm": "audio/wav",
}


def speechkit_tts_configured() -> bool:
    if not ENABLE_ROUTE_AUDIO_TTS:
        return False
    if not YANDEX_CLOUD_FOLDER_ID:
        return False
    return bool(YANDEX_SPEECHKIT_API_KEY or YANDEX_SPEECHKIT_IAM_TOKEN)


def tts_media_type() -> str:
    return _FORMAT_MEDIA_TYPES.get(YANDEX_SPEECHKIT_FORMAT.lower(), "audio/mpeg")


def _auth_header() -> Optional[str]:
    if YANDEX_SPEECHKIT_API_KEY:
        return f"Api-Key {YANDEX_SPEECHKIT_API_KEY}"
    if YANDEX_SPEECHKIT_IAM_TOKEN:
        return f"Bearer {YANDEX_SPEECHKIT_IAM_TOKEN}"
    return None


async def synthesize_speech(text: str) -> bytes:
    """
    Synthesize speech. Raises httpx.HTTPError on API errors.
    """
    stripped = (text or "").strip()
    if not stripped:
        return b""

    auth = _auth_header()
    if not auth or not YANDEX_CLOUD_FOLDER_ID:
        raise RuntimeError("SpeechKit is not configured (folder id / API key / IAM token)")

    # SpeechKit limits per request; keep a safe margin
    if len(stripped) > 4500:
        stripped = stripped[:4497] + "…"

    form = {
        "text": stripped,
        "lang": "ru-RU",
        "voice": YANDEX_SPEECHKIT_VOICE,
        "format": YANDEX_SPEECHKIT_FORMAT,
        "folderId": YANDEX_CLOUD_FOLDER_ID,
    }

    headers = {"Authorization": auth}

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(TTS_URL, data=form, headers=headers)
        response.raise_for_status()
        return response.content
