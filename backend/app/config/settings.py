from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "ChainBridge"
    debug: bool = False

    # Database
    database_url: str = "postgresql+asyncpg://chainbridge:password@localhost:5432/chainbridge"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # JWT
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60

    # Rate Limiting
    rate_limit_enabled: bool = True
    rate_limit_requests: int = 100
    rate_limit_window_seconds: int = 60

    # Stellar
    soroban_rpc_url: str = "https://soroban-testnet.stellar.org"
    chainbridge_contract_id: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
