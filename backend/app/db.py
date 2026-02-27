"""DuckDB 连接管理 — 全局复用同一个 duckdb 文件"""

import os
import duckdb

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "app.duckdb")


def get_conn() -> duckdb.DuckDBPyConnection:
    """返回到 backend/data/app.duckdb 的连接（线程安全模式）"""
    return duckdb.connect(DB_PATH, read_only=False)
