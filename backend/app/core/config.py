"""
Application configuration loaded from environment variables.
Uses pydantic-settings to validate and type-check all config values at startup.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    All application settings, sourced from the .env file.
    Validation happens automatically on import — if a required var is missing,
    the app will refuse to start with a clear error message.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Database (Supabase) ---
    DATABASE_URL: str

    # --- JWT Authentication ---
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # --- Google Gemini ---
    GEMINI_API_KEY: str

    # --- Resend (Email) ---
    RESEND_API_KEY: str
    EMAIL_FROM: str = "onboarding@resend.dev"

    # --- Cron Security ---
    CRON_SECRET_KEY: str

    # --- App ---
    APP_NAME: str = "GoalMGMT"
    FRONTEND_URL: str = "http://localhost:3000"


# Singleton instance — import this wherever settings are needed.
settings = Settings()
