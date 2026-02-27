"""Pydantic 请求/响应模型"""

from pydantic import BaseModel


# ── Upload ──────────────────────────────────────────────
class UploadResponse(BaseModel):
    dataset_id: str


# ── Profile ─────────────────────────────────────────────
class ColumnInfo(BaseModel):
    name: str
    type: str


class MissingRate(BaseModel):
    name: str
    missing_rate: float


class SampleValues(BaseModel):
    name: str
    values: list


class ProfileResponse(BaseModel):
    row_count: int
    columns: list[ColumnInfo]
    missing_rate: list[MissingRate]
    sample_values: list[SampleValues]


# ── Manifest ────────────────────────────────────────────
class ManifestUpdate(BaseModel):
    primary_time_col: str | None = None
    metric_col: str | None = None
    metric_agg: str | None = None
    time_grain: str | None = None


class ManifestResponse(BaseModel):
    dataset_id: str
    view_name: str | None = None
    primary_time_col: str | None = None
    metric_col: str | None = None
    metric_agg: str = "sum"
    time_grain: str = "day"
    dimension_candidates: list[str] = []
    metric_candidates: list[str] = []


# ── Chat Query ──────────────────────────────────────────
class QueryRequest(BaseModel):
    dataset_id: str
    question: str


class QueryMeta(BaseModel):
    trace_id: str
    elapsed_ms: float
    row_count: int


# ── Chart ───────────────────────────────────────────────
class ChartSpec(BaseModel):
    type: str  # "line" | "bar" | "table"
    title: str = ""
    x: str | None = None
    y: str | list[str] | None = None
    series: str | None = None
    data: list[dict] = []


class QueryResponse(BaseModel):
    sql: str
    rows: list[dict]
    meta: QueryMeta
    chart: ChartSpec | None = None


# ── Playbook ────────────────────────────────────────────
class PlaybookRequest(BaseModel):
    dataset_id: str
    playbook: str  # "trend" | "topn" | "cross"
    time_col: str | None = None
    metric_col: str | None = None
    dim_col: str | None = None


# ── 通用错误 ────────────────────────────────────────────
class ErrorResponse(BaseModel):
    detail: str
