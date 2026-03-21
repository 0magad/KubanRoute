from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import date
from core.services.db import supabase
from core.services.llm_service import analyze_sentiment

router = APIRouter()

class ReviewRequest(BaseModel):
    place_id: str
    rating: int
    text: Optional[str] = None
    visited_at: Optional[date] = None

@router.post("/api/reviews")
async def post_review(review: ReviewRequest):
    if not supabase:
        return {"status": "ignored"}
    
    user_id = "mock-user-id" # Placeholder for auth token injection
    
    sentiment_score = 0.0
    keywords = []
    
    if review.text:
        sentiment_score, keywords = await analyze_sentiment(review.text)
        
    try:
        supabase.table('reviews').insert({
            'place_id': review.place_id,
            'user_id': user_id,
            'rating': review.rating,
            'text': review.text,
            'sentiment_score': sentiment_score,
            'keywords': keywords,
            'visited_at': str(review.visited_at) if review.visited_at else None
        }).execute()
    except Exception as e:
        print(f"Failed to save review: {e}")
        raise HTTPException(status_code=500, detail="Failed to save review")
        
    return {"status": "ok", "sentiment_score": sentiment_score}
