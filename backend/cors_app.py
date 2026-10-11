"""
Thin CORS wrapper around the existing FastAPI app.
Run this instead of main.py when you want to use the frontend:

    uvicorn backend.cors_app:app --reload

No backend code is modified — this file simply imports the original app
and adds CORSMiddleware so the browser frontend can call the API.
"""

import os
from pathlib import Path

from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.main import app


def get_allowed_origins() -> list[str]:
    configured = os.getenv("ALLOWED_ORIGINS", "")
    if configured:
        return [origin.strip() for origin in configured.split(",") if origin.strip()]

    return [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]


app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve frontend static files. Keep the production app accessible under /app/
# while preserving the API endpoints defined in backend.main.
frontend_dir = (Path(__file__).resolve().parent.parent / "frontend").resolve()
if frontend_dir.exists():
    app.mount("/app", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")

    @app.get("/app/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        candidate = (frontend_dir / full_path).resolve()
        if candidate.is_file() and frontend_dir in candidate.parents or candidate == frontend_dir:
            return FileResponse(candidate)

        return FileResponse(frontend_dir / "index.html")
