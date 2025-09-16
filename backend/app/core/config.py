from decouple import config
from typing import List

class Settings:
    PROJECT_NAME: str = "IDS-ML"
    VERSION: str = "1.0.0"

    # Database
    SUPABASE_URL: str = config("SUPABASE_URL", default="")
    SUPABASE_KEY: str = config("SUPABASE_KEY", default="")

    # Security
    SECRET_KEY: str = config("SECRET_KEY", default="your-secret-key-here")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    ALLOWED_HOSTS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # ML
    MODEL_STORAGE_PATH: str = config("MODEL_STORAGE_PATH", default="./models")
    DATASET_STORAGE_PATH: str = config("DATASET_STORAGE_PATH", default="./datasets")

settings = Settings()