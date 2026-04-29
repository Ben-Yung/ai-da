"""Game & doll names router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import User, GameSession, DollName, Blessing
from app.schemas import (
    GameSessionCreate, GameSessionResponse,
    DollNameCreate, DollNameResponse,
    BlessingCreate, BlessingResponse,
)
from app.auth import get_current_user
from app.utils.tools import get_tools, get_dolls, get_rhymes

router = APIRouter(prefix="/api", tags=["game"])


# ── Config endpoints ────────────────────────────────
@router.get("/tools")
def list_tools(mode: str = None):
    return {"tools": get_tools(mode)}


@router.get("/dolls")
def list_dolls():
    return {"dolls": get_dolls()}


@router.get("/rhymes")
def list_rhymes(mode: str = "beat"):
    return {"rhymes": get_rhymes(mode)}


# ── Game sessions ───────────────────────────────────
@router.post("/sessions", response_model=GameSessionResponse)
def create_session(
    data: GameSessionCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = GameSession(
        user_id=user.id,
        mode=data.mode,
        score=data.score,
        combo=data.combo,
        tool=data.tool,
        difficulty=data.difficulty,
        result=data.result,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/sessions", response_model=List[GameSessionResponse])
def list_sessions(
    limit: int = 20,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(GameSession)
        .filter(GameSession.user_id == user.id)
        .order_by(GameSession.played_at.desc())
        .limit(limit)
        .all()
    )


@router.get("/sessions/top")
def top_scores(mode: str = "beat", limit: int = 10, db: Session = Depends(get_db)):
    """Global leaderboard for a mode."""
    rows = (
        db.query(GameSession, User.username)
        .join(User)
        .filter(GameSession.mode == mode, GameSession.result == "win")
        .order_by(GameSession.score.desc())
        .limit(limit)
        .all()
    )
    return [
        {"rank": i + 1, "username": r.username, "score": r.GameSession.score, "combo": r.GameSession.combo, "tool": r.GameSession.tool}
        for i, r in enumerate(rows)
    ]


# ── Doll names ──────────────────────────────────────
@router.post("/doll-names", response_model=DollNameResponse)
def save_doll_name(
    data: DollNameCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(DollName)
        .filter(DollName.user_id == user.id, DollName.doll_id == data.doll_id)
        .first()
    )
    if existing:
        existing.custom_name = data.custom_name
    else:
        existing = DollName(user_id=user.id, doll_id=data.doll_id, custom_name=data.custom_name)
        db.add(existing)
    db.commit()
    db.refresh(existing)
    return existing


@router.get("/doll-names", response_model=List[DollNameResponse])
def list_doll_names(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(DollName)
        .filter(DollName.user_id == user.id)
        .all()
    )


# ── Blessings ───────────────────────────────────────
@router.post("/blessings", response_model=BlessingResponse)
def create_blessing(
    data: BlessingCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    b = Blessing(user_id=user.id, message=data.message, paper_doll_id=data.paper_doll_id)
    db.add(b)
    db.commit()
    db.refresh(b)
    return b


@router.get("/blessings", response_model=List[BlessingResponse])
def list_blessings(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Blessing)
        .filter(Blessing.user_id == user.id)
        .order_by(Blessing.created_at.desc())
        .limit(50)
        .all()
    )
