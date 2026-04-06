"""配置管理 — 使用 pydantic-settings 管理环境变量"""

import os

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """应用配置"""

    DATA_DIR: str = os.path.join(os.path.dirname(__file__), "..", "data")
    DB_PATH: str = os.path.join(os.path.dirname(__file__), "..", "data", "app.duckdb")
    MAX_FILE_SIZE_MB: int = 100
    MAX_FILE_SIZE_BYTES: int = 100 * 1024 * 1024  # 100MB

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
