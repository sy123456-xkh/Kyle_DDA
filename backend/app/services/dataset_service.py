"""数据集业务逻辑：上传 CSV、建表、Profiling、Manifest（文件持久化）"""

import json
import os
import re
import uuid
from typing import Optional

from app.config import settings
from app.db import get_conn
from app.exceptions import DatasetNotFoundError
from app.schemas import (
    ColumnInfo,
    ManifestResponse,
    ManifestUpdate,
    MissingRate,
    ProfileResponse,
    SampleValues,
    UploadResponse,
)

DATA_DIR = settings.DATA_DIR

# 内存缓存（以文件为准，内存仅加速读取）
_manifests_cache: dict[str, ManifestResponse] = {}

# 用于自动推断时间列的关键词
_TIME_COL_HINTS = re.compile(r"date|time|日期|时间|month|year|day|week", re.IGNORECASE)
_NUMERIC_TYPES = {
    "BIGINT", "INTEGER", "DOUBLE", "FLOAT", "DECIMAL",
    "SMALLINT", "TINYINT", "HUGEINT",
}


def _safe_id() -> str:
    """生成一个可直接用作 DuckDB 表名的短 ID（仅字母数字下划线）"""
    return "ds_" + re.sub(r"[^a-z0-9]", "", uuid.uuid4().hex[:8])


# ── Manifest 文件读写 ──────────────────────────────────

def _manifest_path(dataset_id: str) -> str:
    return os.path.join(DATA_DIR, f"{dataset_id}.manifest.json")


def _save_manifest(m: ManifestResponse) -> None:
    """将 manifest 写入 JSON 文件并更新内存缓存"""
    os.makedirs(DATA_DIR, exist_ok=True)
    path = _manifest_path(m.dataset_id)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(m.model_dump(), f, ensure_ascii=False, indent=2)
    _manifests_cache[m.dataset_id] = m


def _load_manifest(dataset_id: str) -> Optional[ManifestResponse]:
    """从文件加载 manifest（优先内存缓存）"""
    if dataset_id in _manifests_cache:
        return _manifests_cache[dataset_id]
    path = _manifest_path(dataset_id)
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    m = ManifestResponse(**data)
    _manifests_cache[dataset_id] = m
    return m


# ── 自动推断 ───────────────────────────────────────────

def _guess_time_col(columns: list[ColumnInfo]) -> Optional[str]:
    for c in columns:
        if _TIME_COL_HINTS.search(c.name):
            return c.name
    return None


def _guess_metric_col(columns: list[ColumnInfo]) -> Optional[str]:
    for c in columns:
        if c.type.upper() in _NUMERIC_TYPES:
            return c.name
    return None


def _guess_dimension_candidates(columns: list[ColumnInfo]) -> list[str]:
    """非数值型、非时间列视为维度候选"""
    return [
        c.name for c in columns
        if c.type.upper() not in _NUMERIC_TYPES and not _TIME_COL_HINTS.search(c.name)
    ]


def _guess_metric_candidates(columns: list[ColumnInfo]) -> list[str]:
    """所有数值型列视为指标候选"""
    return [c.name for c in columns if c.type.upper() in _NUMERIC_TYPES]


# ── Upload ──────────────────────────────────────────────
def upload_csv(filename: str, content: bytes) -> UploadResponse:
    dataset_id = _safe_id()
    csv_path = os.path.join(DATA_DIR, f"{dataset_id}.csv")

    os.makedirs(DATA_DIR, exist_ok=True)
    with open(csv_path, "wb") as f:
        f.write(content)

    table_name = f"dataset_{dataset_id}"
    view_name = f"v_dataset_{dataset_id}"

    conn = get_conn()
    try:
        conn.execute(
            f"CREATE TABLE {table_name} AS SELECT * FROM read_csv_auto('{csv_path}')"
        )
        conn.execute(f"CREATE VIEW {view_name} AS SELECT * FROM {table_name}")

        # 获取列信息用于初始化 manifest
        cols_raw = conn.execute(
            f"SELECT column_name, data_type FROM information_schema.columns "
            f"WHERE table_name = '{table_name}'"
        ).fetchall()
        columns = [ColumnInfo(name=c[0], type=c[1]) for c in cols_raw]

        # 自动推断并持久化 manifest
        manifest = ManifestResponse(
            dataset_id=dataset_id,
            view_name=view_name,
            primary_time_col=_guess_time_col(columns),
            metric_col=_guess_metric_col(columns),
            metric_agg="sum",
            time_grain="day",
            dimension_candidates=_guess_dimension_candidates(columns),
            metric_candidates=_guess_metric_candidates(columns),
        )
        _save_manifest(manifest)
    finally:
        conn.close()

    return UploadResponse(dataset_id=dataset_id)


# ── Profile ─────────────────────────────────────────────
def profile_dataset(dataset_id: str) -> ProfileResponse:
    view_name = f"v_dataset_{dataset_id}"
    conn = get_conn()

    try:
        # 1) 行数
        row_count_result = conn.execute(f"SELECT COUNT(*) FROM {view_name}").fetchone()
        row_count: int = row_count_result[0] if row_count_result else 0

        # 2) 列信息（从 information_schema 获取）
        cols_raw = conn.execute(
            f"SELECT column_name, data_type FROM information_schema.columns "
            f"WHERE table_name = 'dataset_{dataset_id}'"
        ).fetchall()
        columns = [ColumnInfo(name=c[0], type=c[1]) for c in cols_raw]

        # 3) 缺失率
        missing_exprs = ", ".join(
            f"SUM(CASE WHEN \"{c.name}\" IS NULL THEN 1 ELSE 0 END)::DOUBLE / COUNT(*)::DOUBLE AS \"{c.name}\""
            for c in columns
        )
        missing_row_result = conn.execute(
            f"SELECT {missing_exprs} FROM {view_name}"
        ).fetchone()
        missing_row = missing_row_result if missing_row_result else tuple([0.0] * len(columns))
        missing_rate = [
            MissingRate(name=columns[i].name, missing_rate=round(missing_row[i] or 0.0, 4))
            for i in range(len(columns))
        ]

        # 4) 样例值（前 5 个非空）
        sample_values: list[SampleValues] = []
        for c in columns:
            rows = conn.execute(
                f'SELECT DISTINCT "{c.name}" FROM {view_name} '
                f'WHERE "{c.name}" IS NOT NULL LIMIT 5'
            ).fetchall()
            sample_values.append(
                SampleValues(name=c.name, values=[r[0] for r in rows])
            )

        return ProfileResponse(
            row_count=row_count,
            columns=columns,
            missing_rate=missing_rate,
            sample_values=sample_values,
        )
    finally:
        conn.close()


# ── Manifest ────────────────────────────────────────────
def get_manifest(dataset_id: str) -> ManifestResponse:
    m = _load_manifest(dataset_id)
    if m is None:
        raise DatasetNotFoundError(f"数据集 {dataset_id} 不存在")
    return m


def update_manifest(dataset_id: str, update: ManifestUpdate) -> ManifestResponse:
    m = _load_manifest(dataset_id)
    if m is None:
        raise DatasetNotFoundError(f"数据集 {dataset_id} 不存在")
    if update.primary_time_col is not None:
        m.primary_time_col = update.primary_time_col
    if update.metric_col is not None:
        m.metric_col = update.metric_col
    if update.metric_agg is not None:
        m.metric_agg = update.metric_agg
    if update.time_grain is not None:
        m.time_grain = update.time_grain
    _save_manifest(m)
    return m
