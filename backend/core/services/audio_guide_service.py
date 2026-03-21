"""
In-memory cache of synthesized audio per route share_token + place id.
"""

import asyncio
import logging
from typing import Optional

from core.models.schemas import GeneratedRoute, RoutePlace
from core.services.speechkit_tts_service import speechkit_tts_configured, synthesize_speech

logger = logging.getLogger(__name__)

_route_place_audio: dict[tuple[str, str], bytes] = {}


def store_route_place_audio(share_token: str, place_id: str, audio: bytes) -> None:
    if audio:
        _route_place_audio[(share_token, place_id)] = audio


def get_route_place_audio(share_token: str, place_id: str) -> Optional[bytes]:
    return _route_place_audio.get((share_token, place_id))


def _guide_text_for_place(place: RoutePlace) -> str:
    t = (place.guide_text or "").strip()
    if t:
        return t
    return (place.short_description or place.name or "").strip()


async def prefetch_route_audio(share_token: str, route: GeneratedRoute) -> None:
    if not speechkit_tts_configured():
        logger.info("SpeechKit TTS disabled or not configured — skipping audio prefetch")
        return

    sem = asyncio.Semaphore(3)

    async def synth_one(place: RoutePlace) -> None:
        text = _guide_text_for_place(place)
        if len(text) < 12:
            return
        async with sem:
            try:
                audio = await synthesize_speech(text)
                if audio:
                    store_route_place_audio(share_token, place.id, audio)
            except Exception as e:
                logger.warning("TTS failed for place %s: %s", place.id, e)

    tasks: list[asyncio.Task] = []
    for day in route.days:
        for p in day.places:
            tasks.append(asyncio.create_task(synth_one(p)))
    if tasks:
        await asyncio.gather(*tasks)


async def ensure_place_audio(share_token: str, place: RoutePlace) -> Optional[bytes]:
    cached = get_route_place_audio(share_token, place.id)
    if cached:
        return cached
    if not speechkit_tts_configured():
        return None
    text = _guide_text_for_place(place)
    if len(text) < 12:
        return None
    try:
        audio = await synthesize_speech(text)
        if audio:
            store_route_place_audio(share_token, place.id, audio)
        return audio
    except Exception as e:
        logger.warning("Lazy TTS failed for place %s: %s", place.id, e)
        return None


def find_place_in_route(route: GeneratedRoute, place_id: str) -> Optional[RoutePlace]:
    for day in route.days:
        for p in day.places:
            if p.id == place_id:
                return p
    return None
