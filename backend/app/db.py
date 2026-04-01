"""DuckDB 连接管理 — 全局复用同一个 duckdb 文件"""

import os
import re
from typing import Any, Optional
import duckdb

from app.config import settings

DB_PATH = settings.DB_PATH


def get_conn() -> duckdb.DuckDBPyConnection:
    """返回到 backend/data/app.duckdb 的连接（线程安全模式）"""
    return duckdb.connect(DB_PATH, read_only=False)


def validate_identifier(identifier: str) -> bool:
    """验证标识符（表名、列名）是否安全"""
    # 仅允许字母、数字、下划线
    return bool(re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', identifier))


def execute_safe(conn: duckdb.DuckDBPyConnection, sql: str, params: Optional[dict[str, Any]] = None) -> Any:
    """执行参数化查询（用于用户输入的值）"""
    if params:
        return conn.execute(sql, params)
    return conn.execute(sql)
