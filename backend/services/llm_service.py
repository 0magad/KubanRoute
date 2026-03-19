"""
LLM Service: generates narrative text for routes via Ollama (local) or OpenAI.
"""

import httpx
import json
import logging
from config import OLLAMA_BASE_URL, OLLAMA_MODEL, OPENAI_API_KEY, LLM_PROVIDER

logger = logging.getLogger(__name__)


# Mapping for readable labels
GROUP_LABELS = {
    "solo": "Одиночный путешественник",
    "couple": "Пара",
    "family": "Семья с детьми",
    "company": "Компания друзей",
    "elderly": "Пожилые люди",
}

INTEREST_LABELS = {
    "wine": "Вино и виноделие",
    "nature": "Природа и треккинг",
    "history": "История и культура",
    "farming": "Фермерство и агротуризм",
    "active": "Активный отдых",
    "remote": "Удалённая работа",
}


def build_prompt(profile: dict, days_structure: list[dict]) -> tuple[str, str]:
    """Build system and user prompts for LLM."""
    group_type = GROUP_LABELS.get(profile.get("group_type", ""), profile.get("group_type", ""))
    interests = ", ".join(
        INTEREST_LABELS.get(i, i) for i in profile.get("interests", [])
    )

    days_text = ""
    for day in days_structure:
        places_list = ", ".join(p["name"] for p in day.get("places", []))
        days_text += f"День {day['day_number']}: {places_list}\n"

    system_prompt = (
        "Ты — опытный путешественник и автор путеводителей по Краснодарскому краю. "
        "Пишешь живо, от первого лица, без рекламных клише. Знаешь каждый уголок региона. "
        "ВАЖНО: пиши ТОЛЬКО на русском языке, без латиницы и английских слов. "
        "Отвечай ТОЛЬКО валидным JSON без markdown-блоков."
    )

    user_prompt = f"""Создай описание маршрута для следующего путешественника:
- Тип группы: {group_type}
- Интересы: {interests}
- Количество дней: {len(days_structure)}

Маршрут (факты из базы данных):
{days_text}

Напиши на РУССКОМ языке (без латиницы!):
1. Название маршрута (до 10 слов, цепляющее, по-русски)
2. Вступление (3-4 предложения, атмосфера и суть)
3. Описание каждого дня (1-2 предложения)
4. Название каждого дня (до 5 слов)

Отвечай ТОЛЬКО в JSON формате:
{{"title": "...", "intro": "...", "days": [{{"day_number": 1, "title": "...", "description": "..."}}]}}"""

    return system_prompt, user_prompt


async def generate_narrative(profile: dict, days_structure: list[dict]) -> dict:
    """Generate narrative using Ollama or OpenAI. Returns fallback on error."""
    system_prompt, user_prompt = build_prompt(profile, days_structure)

    try:
        if LLM_PROVIDER == "openai" and OPENAI_API_KEY:
            return await _call_openai(system_prompt, user_prompt)
        else:
            return await _call_ollama(system_prompt, user_prompt)
    except Exception as e:
        logger.error(f"LLM generation failed: {e}")
        return _fallback_narrative(days_structure)


async def _ensure_model_loaded():
    """Pre-load model into memory. Tries API first, then CLI fallback."""
    import subprocess
    import asyncio

    # Try API approach first
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            logger.info(f"Pre-loading model {OLLAMA_MODEL} via API...")
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/chat",
                json={
                    "model": OLLAMA_MODEL,
                    "messages": [{"role": "user", "content": "Привет"}],
                    "stream": False,
                    "options": {"num_predict": 5},
                },
            )
            response.raise_for_status()
            logger.info("Model loaded via API!")
            return True
    except Exception as e:
        logger.warning(f"API pre-load failed: {e}")

    # Fallback: use CLI to warm up the model
    try:
        logger.info(f"Loading model via CLI: ollama run {OLLAMA_MODEL}...")
        result = subprocess.run(
            ["ollama", "run", OLLAMA_MODEL, "Ответь одним словом: привет"],
            capture_output=True, text=True, timeout=120,
        )
        if result.returncode == 0:
            logger.info(f"CLI loaded model. Response: {result.stdout.strip()[:50]}")
            # Give it a moment to be ready for API calls
            await asyncio.sleep(3)
            return True
        else:
            logger.warning(f"CLI failed: {result.stderr}")
            return False
    except Exception as e:
        logger.warning(f"CLI pre-load failed: {e}")
        return False


async def _call_ollama(system_prompt: str, user_prompt: str) -> dict:
    """Call Ollama via CLI subprocess (HTTP API returns 503 on some systems)."""
    import subprocess

    full_prompt = f"{system_prompt}\n\n{user_prompt}"

    try:
        logger.info("Calling Ollama via CLI...")
        result = subprocess.run(
            ["ollama", "run", OLLAMA_MODEL, full_prompt],
            capture_output=True, text=True, timeout=120,
            encoding="utf-8",
        )

        if result.returncode != 0:
            raise RuntimeError(f"ollama CLI error: {result.stderr}")

        response_text = result.stdout.strip()
        logger.info(f"Ollama CLI response length: {len(response_text)} chars")

        # Try to extract JSON from response
        # LLM might wrap JSON in markdown code blocks
        json_text = response_text
        if "```json" in json_text:
            json_text = json_text.split("```json")[1].split("```")[0].strip()
        elif "```" in json_text:
            json_text = json_text.split("```")[1].split("```")[0].strip()

        # Find JSON object boundaries
        start = json_text.find("{")
        end = json_text.rfind("}") + 1
        if start >= 0 and end > start:
            json_text = json_text[start:end]

        parsed = json.loads(json_text)
        logger.info(f"✅ LLM generated title: {parsed.get('title', '?')}")
        return parsed

    except json.JSONDecodeError as e:
        logger.warning(f"Failed to parse LLM JSON: {e}")
        logger.warning(f"Raw response: {response_text[:200]}")
        raise
    except subprocess.TimeoutExpired:
        logger.error("Ollama CLI timed out after 120s")
        raise
    except Exception as e:
        logger.error(f"Ollama CLI failed: {e}")
        raise


async def _call_openai(system_prompt: str, user_prompt: str) -> dict:
    """Call OpenAI API."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "max_tokens": 800,
                "temperature": 0.7,
            },
        )
        response.raise_for_status()
        data = response.json()
        text = data["choices"][0]["message"]["content"]
        result = json.loads(text)
        return result


def _fallback_narrative(days_structure: list[dict]) -> dict:
    """Fallback narrative when LLM is unavailable."""
    fallback_titles = [
        "Путешествие по кубанским просторам",
        "Дорогами Краснодарского края",
        "Открытие Кубани: от виноградников до моря",
    ]

    days = []
    for day in days_structure:
        places = day.get("places", [])
        place_names = ", ".join(p["name"] for p in places[:3])
        days.append({
            "day_number": day["day_number"],
            "title": f"День {day['day_number']}",
            "description": f"В этот день вас ждут: {place_names}. "
                           "Каждое место — маленькое открытие Кубани.",
        })

    return {
        "title": fallback_titles[len(days_structure) % len(fallback_titles)],
        "intro": (
            "Этот маршрут проведёт вас через лучшие места Краснодарского края — "
            "от тихих виноградников до горных троп. Каждая остановка — "
            "возможность увидеть регион глазами местных жителей. "
            "Просто положите телефон в карман и наслаждайтесь дорогой."
        ),
        "days": days,
    }
