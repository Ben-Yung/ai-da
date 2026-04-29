"""SQLAlchemy ORM models."""
import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Float, DateTime, ForeignKey, Enum as SAEnum,
)
from sqlalchemy.orm import relationship
from app.database import Base
import enum


# ── Enums ────────────────────────────────────────────
class GameMode(str, enum.Enum):
    BEAT = "beat"
    HUG = "hug"


class Difficulty(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


# ── Tables ───────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(50), default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    game_sessions = relationship("GameSession", back_populates="user", cascade="all, delete")
    doll_names = relationship("DollName", back_populates="user", cascade="all, delete")
    blessings = relationship("Blessing", back_populates="user", cascade="all, delete")


class GameSession(Base):
    __tablename__ = "game_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mode = Column(SAEnum(GameMode), nullable=False)
    score = Column(Integer, default=0)
    combo = Column(Integer, default=0)
    tool = Column(String(30), default="slipper")
    difficulty = Column(SAEnum(Difficulty), default=Difficulty.EASY)
    result = Column(String(10), default="")  # win / lose
    played_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="game_sessions")


class DollName(Base):
    __tablename__ = "doll_names"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doll_id = Column(String(50), nullable=False)
    custom_name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="doll_names")


class Blessing(Base):
    __tablename__ = "blessings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    paper_doll_id = Column(String(50), default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="blessings")
