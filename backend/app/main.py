"""FastAPI main entry point."""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import engine, Base
from app.routers import auth, game, users

settings = get_settings()

# Create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="愛打 API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API routers ──
app.include_router(auth.router)
app.include_router(game.router)
app.include_router(users.router)

# ── Static frontend ──
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
if os.path.isdir(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "1.0.0"}
