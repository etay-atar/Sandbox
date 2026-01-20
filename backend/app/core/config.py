import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Application Settings
    ====================
    Uses Pydantic BaseSettings to read environment variables automatically.
    Defaults are provided for the local development environment.
    """
    
    # Project Info
    PROJECT_NAME: str = "CyberSecurity Sandbox"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    # Database (PostgreSQL)
    # Using 'postgres' as host when running inside docker-compose, 
    # but 'localhost' when running locally.
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "sandbox_user")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "sandbox_password")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "sandbox_db")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        """Constructs the async Postgres connection string."""
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Security (JWT)
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Redis (Queue)
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = 6379

    # MinIO (Storage)
    MINIO_ENDPOINT: str = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    MINIO_ACCESS_KEY: str = os.getenv("MINIO_ACCESS_KEY", "minio_admin")
    MINIO_SECRET_KEY: str = os.getenv("MINIO_SECRET_KEY", "minio_password")
    MINIO_BUCKET_NAME: str = "malware-samples"
    MINIO_SECURE: bool = False # False for local dev (HTTP), True for Prod (HTTPS)

    # Config loading
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )

settings = Settings()
