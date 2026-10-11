"""
Thin CORS wrapper around the existing FastAPI app.
Run this instead of main.py when you want to use the frontend:

    uvicorn backend.cors_app:app --reload

No backend code is modified — this file simply imports the original app
and adds CORSMiddleware so the browser frontend can call the API.
"""

from backend.main import app
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve frontend static files
frontend_dir = Path(__file__).parent.parent / "frontend"
if frontend_dir.exists():
    app.mount("/app", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")
