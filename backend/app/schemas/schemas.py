from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# --- Auth Schemas ---

class UserSignup(BaseModel):
    email: str
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=1)
    specialization: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    refresh_token: str


# --- User Schemas ---

class UserProfile(BaseModel):
    id: int
    email: str
    full_name: str
    specialization: Optional[str] = None
    photo_path: Optional[str] = None
    voice_sample_path: Optional[str] = None
    is_onboarded: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    specialization: Optional[str] = None


# --- Reel Schemas ---

class ReelCreate(BaseModel):
    topic: str = Field(min_length=3, max_length=500)
    language: str = Field(default="en", pattern="^(en|hi)$")


class ReelResponse(BaseModel):
    id: int
    topic: str
    language: str
    status: str
    script_text: Optional[str] = None
    audio_path: Optional[str] = None
    video_raw_path: Optional[str] = None
    video_final_path: Optional[str] = None
    error_message: Optional[str] = None
    duration_seconds: Optional[float] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ReelList(BaseModel):
    reels: List[ReelResponse]
    total: int
    page: int
    per_page: int


class ScriptUpdate(BaseModel):
    script_text: str = Field(min_length=10)
