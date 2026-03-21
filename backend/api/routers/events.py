import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from core.services.db import supabase

router = APIRouter()

class EventItem(BaseModel):
    event_type: str
    place_id: str
    metadata: Dict[str, Any] = {}

class EventBatch(BaseModel):
    events: List[EventItem]

@router.post("/api/events")
async def track_events(body: EventBatch):
    """
    Mocked endpoint without auth dependency for now.
    In real app, we use Depends(get_current_user).
    """
    if not supabase:
        return {"status": "ignored"}
        
    for event in body.events:
        # We need a user ID. Usually we would extract from NextAuth session token.
        # For hackathon demo, we will insert as anon or mock user if not provided.
        # But ToR requires user_id. Here we just catch and insert.
        try:
            supabase.table('user_events').insert({
                'place_id': event.place_id,
                'event_type': event.event_type,
                'metadata': event.metadata
            }).execute()
            
            # Additional logic for likes
            if event.event_type == 'card_like':
                # Increment place like count
                # supabase doesn't have native increment without rpc, but let's assume we do RPC later
                pass
        except Exception as e:
            print(f"Failed to record event: {e}")

    return {"status": "ok", "processed": len(body.events)}
