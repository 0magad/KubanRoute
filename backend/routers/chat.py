import json
import asyncio
import httpx
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from core.models.schemas import ChatMessage, CurrentUser
from config import OLLAMA_BASE_URL, OLLAMA_MODEL, SYSTEM_PROMPT
from core.services.db import supabase
from core.auth import get_current_user

router = APIRouter()



EXTRACTION_PROMPT = """
Извлеки из сообщения пользователя данные. Верни ТОЛЬКО JSON, без пояснений.
 
Сообщение: "{message}"
 
{
  "has_car":          true | false | null,
  "travel_style":     "solo" | "couple" | "family" | "group" | null,
  "budget_tier":      "low" | "mid" | "high" | null,
  "has_children":     true | false | null,
  "age_group":        "young" | "adult" | "senior" | null,
  "interests":        ["вино", "природа", "история"] | [],
  "dislikes":         ["пляж", "шум", "толпы"] | [],
  "travel_days":      3 | null,
  "travel_months":    [6, 7] | [],
  "weather_preference":"warm" | "cold" | "indoor_only" | "any" | null,
  "min_temp_comfort": 15 | null
}
"""

async def run_extraction(user_id: str, message: str):
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": EXTRACTION_PROMPT.replace("{message}", message),
                    "stream": False
                }
            )
            data_text = resp.json().get('response', '')
            try:
                # Find JSON block
                if "{" in data_text and "}" in data_text:
                    data_text = data_text[data_text.find("{"):data_text.rfind("}")+1]
                data = json.loads(data_text)
                print(f"Extraction result for {user_id}: {data}")
                # In real app: merge into user profile
            except json.JSONDecodeError:
                pass
    except Exception as e:
        print(f"Extraction failed: {e}")

@router.post("/api/chat")
async def chat_endpoint(msg: ChatMessage, user: CurrentUser = Depends(get_current_user)):
    user_id = user.id

    # Normally fetch history and profile here
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": msg.text}
    ]

    async def stream():
        full = ""
        try:
            async with httpx.AsyncClient(timeout=120) as client:
                async with client.stream("POST", f"{OLLAMA_BASE_URL}/api/chat", json={
                    "model": OLLAMA_MODEL,
                    "messages": messages,
                    "stream": True
                }) as resp:
                    async for line in resp.aiter_lines():
                        if line:
                            chunk = json.loads(line)
                            token = chunk.get("message", {}).get("content", "")
                            if token:
                                full += token
                                yield f"data: {json.dumps({'token': token})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            
        # Post-processing
        asyncio.create_task(run_extraction(user_id, msg.text))

    return StreamingResponse(stream(), media_type="text/event-stream")
