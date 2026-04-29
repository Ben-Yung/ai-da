"""Pydantic schemas for request/response validation."""
from pydantic import BaseModel, Field
from typing import Optional
import datetime


# ── Auth ─────────────────────────────────────────────
class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    password: str = Field(..., min_length=4, max_length=100)


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str


# ── Game ─────────────────────────────────────────────
class GameSessionCreate(BaseModel):
    mode: str = "beat"  # beat / hug
    tool: str = "slipper"
    difficulty: str = "easy"
    score: int = 0
    combo: int = 0
    result: str = ""


class GameSessionResponse(BaseModel):
    id: int
    mode: str
    score: int
    combo: int
    tool: str
    difficulty: str
    result: str
    played_at: datetime.datetime

    class Config:
        from_attributes = True


# ── Doll Names ───────────────────────────────────────
class DollNameCreate(BaseModel):
    doll_id: str
    custom_name: str = Field(..., min_length=1, max_length=100)


class DollNameResponse(BaseModel):
    id: int
    doll_id: str
    custom_name: str

    class Config:
        from_attributes = True


# ── Blessings ────────────────────────────────────────
class BlessingCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=500)
    paper_doll_id: str = ""


class BlessingResponse(BaseModel):
    id: int
    message: str
    paper_doll_id: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# ── User Profile ────────────────────────────────────
class UserProfileResponse(BaseModel):
    id: int
    username: str
    display_name: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True
