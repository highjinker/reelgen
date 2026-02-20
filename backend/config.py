from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./reelgen.db"
    SECRET_KEY: str = "change-me-in-production"
    GROQ_API_KEY: str = ""
    REPLICATE_API_TOKEN: str = ""
    TTS_BACKEND: str = "local"  # "local" or "replicate"
    STORAGE_PATH: str = "./storage"

    # JWT settings
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # File upload limits
    MAX_IMAGE_SIZE_MB: int = 10
    MAX_AUDIO_SIZE_MB: int = 50
    MIN_IMAGE_DIMENSION: int = 512
    MIN_VOICE_DURATION_S: int = 10
    MAX_VOICE_DURATION_S: int = 30

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
