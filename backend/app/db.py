"""DuckDB 连接管理 — 全局复用同一个 duckdb 文件"""

import re
import threading
from typing import Any, Optional

import duckdb

from app.config import settings

DB_PATH = settings.DB_PATH

# 线程本地存储连接
_thread_local = threading.local()


def get_conn() -> duckdb.DuckDBPyConnection:
    """返回到 backend/data/app.duckdb 的连接（线程安全，连接复用）。
    若连接已关闭则自动重建。
    """
    conn = getattr(_thread_local, "connection", None)
    if conn is None:
        _thread_local.connection = duckdb.connect(DB_PATH, read_only=False)
        return _thread_local.connection  # type: ignore[no-any-return]
    # 检测连接是否已关闭（执行轻量测试查询）
    try:
        conn.execute("SELECT 1")
    except Exception:
        _thread_local.connection = duckdb.connect(DB_PATH, read_only=False)
    return _thread_local.connection  # type: ignore[no-any-return]


def close_all_connections() -> None:
    """关闭所有连接"""
    if hasattr(_thread_local, "connection") and _thread_local.connection:
        _thread_local.connection.close()
        _thread_local.connection = None


def init_metadata_tables() -> None:
    """初始化元数据表"""
    conn = get_conn()

    # 创建 datasets 表
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS datasets (
            id VARCHAR PRIMARY KEY,
            filename VARCHAR,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            row_count INTEGER,
            column_count INTEGER
        )
    """
    )

    # 创建自增序列（若不存在）
    conn.execute("CREATE SEQUENCE IF NOT EXISTS seq_query_history")

    # 创建 query_history 表（id 使用序列自增）
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS query_history (
            id INTEGER DEFAULT nextval('seq_query_history') PRIMARY KEY,
            dataset_id VARCHAR,
            question VARCHAR,
            sql VARCHAR,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            elapsed_ms DOUBLE
        )
    """
    )

    conn.commit()


def validate_identifier(identifier: str) -> bool:
    """验证标识符（表名、列名）是否安全"""
    # 仅允许字母、数字、下划线
    return bool(re.match(r"^[a-zA-Z_][a-zA-Z0-9_]*$", identifier))


def execute_safe(
    conn: duckdb.DuckDBPyConnection, sql: str, params: Optional[dict[str, Any]] = None
) -> Any:
    """执行参数化查询（用于用户输入的值）"""
    if params:
        return conn.execute(sql, params)
    return conn.execute(sql)
