"""Pydantic 请求/响应模型"""

from typing import Optional, Union

from pydantic import BaseModel


# ── Upload ──────────────────────────────────────────────
class UploadResponse(BaseModel):
    """CSV 上传成功后返回的数据集 ID。"""

    dataset_id: str


# ── Profile ─────────────────────────────────────────────
class ColumnInfo(BaseModel):
    """单列的名称与 DuckDB 数据类型。"""

    name: str
    type: str


class MissingRate(BaseModel):
    """单列的缺失率（0~1）。"""

    name: str
    missing_rate: float


class SampleValues(BaseModel):
    """单列的前 5 个非空样例值。"""

    name: str
    values: list


class ProfileResponse(BaseModel):
    """数据集 profiling 结果，包含行数、列信息、缺失率和样例值。"""

    row_count: int
    columns: list[ColumnInfo]
    missing_rate: list[MissingRate]
    sample_values: list[SampleValues]


# ── Manifest ────────────────────────────────────────────
class ManifestUpdate(BaseModel):
    """用于更新 manifest 的可选字段（PATCH 语义）。"""

    primary_time_col: Optional[str] = None
    metric_col: Optional[str] = None
    metric_agg: Optional[str] = None
    time_grain: Optional[str] = None


class ManifestResponse(BaseModel):
    """数据集语义推断结果，包含时间列、指标列及候选维度/指标列表。"""

    dataset_id: str
    view_name: Optional[str] = None
    primary_time_col: Optional[str] = None
    metric_col: Optional[str] = None
    metric_agg: str = "sum"
    time_grain: str = "day"
    dimension_candidates: list[str] = []
    metric_candidates: list[str] = []


# ── Chat Query ──────────────────────────────────────────
class QueryRequest(BaseModel):
    """聊天查询请求：数据集 ID + 自然语言问题。"""

    dataset_id: str
    question: str


class QueryMeta(BaseModel):
    """查询执行元信息：trace ID、耗时（毫秒）和返回行数。"""

    trace_id: str
    elapsed_ms: float
    row_count: int


# ── Chart ───────────────────────────────────────────────
class ChartSpec(BaseModel):
    """图表规格：类型、轴映射和数据（由 execute_query 填充）。"""

    type: str  # "line" | "bar" | "pie" | "table"
    title: str = ""
    x: Optional[str] = None
    y: Optional[Union[str, list[str]]] = None
    series: Optional[str] = None
    data: list[dict] = []


class QueryResponse(BaseModel):
    """查询执行结果：生成的 SQL、数据行、元信息及可选图表 spec。"""

    sql: str
    rows: list[dict]
    meta: QueryMeta
    chart: Optional[ChartSpec] = None


# ── Playbook ────────────────────────────────────────────
class PlaybookRequest(BaseModel):
    """预定义分析 playbook 请求：类型（trend/topn/cross）及所需列参数。"""

    dataset_id: str
    playbook: str  # "trend" | "topn" | "cross"
    time_col: Optional[str] = None
    metric_col: Optional[str] = None
    dim_col: Optional[str] = None


# ── 通用错误 ────────────────────────────────────────────
class ErrorResponse(BaseModel):
    """通用错误响应体。"""

    detail: str


# ── AI Insight ──────────────────────────────────────────
class AIInsightRequest(BaseModel):
    """AI 洞察请求：数据集 ID、用户问题、可选图表 spec 和样本数据。"""

    dataset_id: str
    question: str
    chart: Optional[ChartSpec] = None
    rows: list[dict] = []
    manifest: dict = {}


class ABTestSpec(BaseModel):
    """A/B 测试方案规格。"""

    goal: str
    metric: str
    design: str
    duration: str


class AIInsightResponse(BaseModel):
    """AI 洞察响应：核心结论、可执行建议和 A/B 测试方案。"""

    insight: str
    suggestions: list[str]
    ab_test: Optional[ABTestSpec] = None
