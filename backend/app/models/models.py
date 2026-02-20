from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    specialization = Column(String, nullable=True)
    photo_path = Column(String, nullable=True)
    voice_sample_path = Column(String, nullable=True)
    is_onboarded = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    reels = relationship("Reel", back_populates="user", cascade="all, delete-orphan")


class Reel(Base):
    __tablename__ = "reels"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic = Column(String, nullable=False)
    language = Column(String, default="en")  # "en" or "hi"
    status = Column(String, default="pending")
    # Status flow: pending → generating_script → script_ready → generating_audio
    #              → generating_video → post_processing → completed | failed
    script_text = Column(Text, nullable=True)
    audio_path = Column(String, nullable=True)
    video_raw_path = Column(String, nullable=True)
    video_final_path = Column(String, nullable=True)
    error_message = Column(Text, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="reels")
