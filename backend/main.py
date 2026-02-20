import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from config import get_settings
from app.database import engine, Base
from app.models import User, Reel  # noqa: F401 - ensure models are registered


settings = get_settings()

# Export API keys to env so third-party libs (replicate, groq) can find them
if settings.REPLICATE_API_TOKEN:
    os.environ["REPLICATE_API_TOKEN"] = settings.REPLICATE_API_TOKEN
if settings.GROQ_API_KEY:
    os.environ["GROQ_API_KEY"] = settings.GROQ_API_KEY


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    Base.metadata.create_all(bind=engine)
    # Ensure storage directories exist
    for subdir in [
        "uploads/photos", "uploads/voice_samples",
        "generated/audio", "generated/video_raw", "generated/video_final",
    ]:
        os.makedirs(os.path.join(settings.STORAGE_PATH, subdir), exist_ok=True)
    yield


app = FastAPI(
    title="ReelGen API",
    description="AI Reel Generator for Indian Doctors",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount storage for serving files
os.makedirs(settings.STORAGE_PATH, exist_ok=True)
app.mount("/storage", StaticFiles(directory=settings.STORAGE_PATH), name="storage")


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "reelgen"}


# Import and include routers (added as they're implemented)
from app.routers import auth, users, reels  # noqa: E402

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(reels.router, prefix="/api/reels", tags=["reels"])

# --- Serve frontend build (production) ---
FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"

if FRONTEND_DIST.is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="frontend-assets")

    @app.get("/{full_path:path}")
    async def spa_catch_all(request: Request, full_path: str):
        """Serve index.html for any non-API route (SPA catch-all)."""
        file_path = FRONTEND_DIST / full_path
        if full_path and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")
