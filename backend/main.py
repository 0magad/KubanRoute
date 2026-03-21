"""
KubanRoute Backend — FastAPI Application
Генератор персонализированных туристических маршрутов по Краснодарскому краю.
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import HOST, PORT

from api.routers import generate, places, routes, business, weather, events, reviews, chat, recommendations, pdf_export

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="KubanRoute API",
    description="Генератор персонализированных туристических маршрутов по Краснодарскому краю",
    version="1.0.0",
)

# CORS — allow frontend to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://kubanroute.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(generate.router, tags=["Generate"])
app.include_router(places.router, tags=["Places"])
app.include_router(routes.router, tags=["Routes"])
app.include_router(business.router, tags=["Business"])
app.include_router(weather.router, tags=["Weather"])
app.include_router(events.router, tags=["Events"])
app.include_router(reviews.router, tags=["Reviews"])
app.include_router(chat.router, tags=["Chat"])
app.include_router(recommendations.router, tags=["Recommendations"])
app.include_router(pdf_export.router, tags=["PDF Export"])

@app.on_event("startup")
async def startup_event():
    """Pre-load Ollama model into memory on startup."""
    from core.services.llm_service import _ensure_model_loaded
    logger.info("🚀 Starting KubanRoute API...")
    logger.info("⏳ Pre-loading LLM model (this may take 15-30 seconds)...")
    success = await _ensure_model_loaded()
    if success:
        logger.info("✅ LLM model loaded and ready!")
    else:
        logger.warning("⚠️ LLM not available — will use fallback texts")


@app.get("/")
def root():
    """Health check endpoint."""
    return {
        "service": "KubanRoute API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/health")
def health():
    """Health check for monitoring."""
    from core.services.places_service import get_places_count
    return {
        "status": "ok",
        "places_count": get_places_count(),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=int(PORT), reload=True)
