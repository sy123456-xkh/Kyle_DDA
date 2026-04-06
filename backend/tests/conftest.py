"""pytest 全局 fixtures — 隔离临时目录、DuckDB 连接、FastAPI 测试客户端"""

import os
import pytest

from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# tmp_data_dir — 每个测试函数使用独立的临时目录
# ---------------------------------------------------------------------------
@pytest.fixture(autouse=True)
def tmp_data_dir(tmp_path, monkeypatch):
    """将 DATA_DIR 与 DB_PATH 重定向到 pytest 临时目录，完全隔离于 backend/data/。"""
    data_dir = str(tmp_path)
    db_path = os.path.join(data_dir, "test.duckdb")

    # --- 1. patch settings 对象本身 ---
    from app.config import settings
    monkeypatch.setattr(settings, "DATA_DIR", data_dir)
    monkeypatch.setattr(settings, "DB_PATH", db_path)

    # --- 2. patch db.py 的模块级变量 ---
    import app.db as db_module
    monkeypatch.setattr(db_module, "DB_PATH", db_path)

    # --- 3. 关闭并清除线程本地 DuckDB 连接，让 get_conn() 重新建立到新路径 ---
    db_module.close_all_connections()

    # --- 4. patch dataset_service.py 的模块级 DATA_DIR ---
    import app.services.dataset_service as ds_module
    monkeypatch.setattr(ds_module, "DATA_DIR", data_dir)

    # --- 5. 清空 manifest 内存缓存，避免跨测试污染 ---
    monkeypatch.setattr(ds_module, "_manifests_cache", {})

    # --- 6. 重新初始化元数据表（新 DB 文件） ---
    from app.db import init_metadata_tables
    init_metadata_tables()

    yield data_dir

    # 测试结束后关闭连接（tmp_path 自动清理文件）
    db_module.close_all_connections()


# ---------------------------------------------------------------------------
# test_client — FastAPI TestClient（每次测试函数重新创建）
# ---------------------------------------------------------------------------
@pytest.fixture()
def test_client(tmp_data_dir):
    """返回 FastAPI TestClient 实例（依赖 tmp_data_dir 确保 DB 已初始化）。"""
    from app.main import app
    with TestClient(app, raise_server_exceptions=False) as client:
        yield client


# ---------------------------------------------------------------------------
# sample_csv_bytes — 5 行测试 CSV
# ---------------------------------------------------------------------------
@pytest.fixture()
def sample_csv_bytes() -> bytes:
    """返回包含 date/product/revenue 三列、5 行数据的 CSV bytes。"""
    csv_content = (
        "date,product,revenue\n"
        "2024-01-01,Apple,100\n"
        "2024-01-02,Banana,200\n"
        "2024-01-03,Cherry,300\n"
        "2024-01-04,Durian,400\n"
        "2024-01-05,Elderberry,500\n"
    )
    return csv_content.encode("utf-8")


# ---------------------------------------------------------------------------
# uploaded_dataset — 上传 CSV 并返回 dataset_id
# ---------------------------------------------------------------------------
@pytest.fixture()
def uploaded_dataset(test_client, sample_csv_bytes) -> str:
    """上传 sample_csv_bytes 到 /datasets/upload，返回 dataset_id 字符串。"""
    response = test_client.post(
        "/datasets/upload",
        files={"file": ("test_data.csv", sample_csv_bytes, "text/csv")},
    )
    assert response.status_code == 200, f"上传失败: {response.text}"
    data = response.json()
    assert "dataset_id" in data
    return data["dataset_id"]
