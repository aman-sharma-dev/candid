import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database Configuration
    DATABASE_URL: Optional[str] = os.getenv(
        "DATABASE_URL",
        "sqlite:///./sqlite_fallback.db"  # Fallback to local SQLite if PG is not configured
    )

    # Demo Mode Configuration
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() == "true"

    # Hugging Face Settings
    HF_HOME: str = os.getenv("HF_HOME", "/root/.cache/huggingface")

    # GitHub Token (optional)
    GITHUB_TOKEN: Optional[str] = os.getenv("GITHUB_TOKEN", None)

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
