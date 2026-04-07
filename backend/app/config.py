"""配置管理 — 使用 pydantic-settings 管理环境变量"""

import os

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """应用配置"""

    DATA_DIR: str = os.path.join(os.path.dirname(__file__), "..", "data")
    DB_PATH: str = os.path.join(os.path.dirname(__file__), "..", "data", "app.duckdb")
    MAX_FILE_SIZE_MB: int = 100
    MAX_FILE_SIZE_BYTES: int = 100 * 1024 * 1024  # 100MB

    # LLM 配置（OpenAI-compatible，支持 Claude/DeepSeek 等）
    llm_base_url: str = "https://api.deepseek.com"
    llm_api_key: str = ""
    llm_model: str = "deepseek-chat"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
