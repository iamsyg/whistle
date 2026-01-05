from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_JWT_SECRET: str
    
    # Rate limiting
    MAX_MESSAGES_PER_WINDOW: int = 10
    RATE_LIMIT_WINDOW_SECONDS: int = 10
    
    # WebSocket
    WS_HEARTBEAT_INTERVAL: int = 30
    WS_TIMEOUT: int = 60
    
    class Config:
        env_file = ".env"

settings = Settings()