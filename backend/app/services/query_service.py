"""聊天查询服务：规则匹配生成 SQL → 护栏检查 → DuckDB 执行"""

import logging
import re
import time
import uuid

from app.db import get_conn
from app.schemas import ChartSpec, PlaybookRequest, QueryMeta, QueryResponse
from app.services.dataset_service import get_manifest

logger = logging.getLogger("chat-to-bi")

# SQL 护栏：禁止的关键词（大写匹配）
_FORBIDDEN_KEYWORDS = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|REPLACE|MERGE|GRANT|REVOKE)\b",
    re.IGNORECASE,
)

# 检测是否已有 LIMIT 子句
_HAS_LIMIT = re.compile(r"\bLIMIT\s+\d+", re.IGNORECASE)

# 计数类关键词
_COUNT_KEYWORDS = re.compile(r"行数|count|多少行|总数|总共|有几", re.IGNORECASE)

# 聚合函数白名单
_VALID_AGGS = {"sum", "avg", "count"}


def _trace_id() -> str:
    return "trc_" + uuid.uuid4().hex[:8]


def _guard_sql(sql: str, max_limit: int = 5000) -> str:
    """SQL 护栏：拒绝非 SELECT 语句，自动补 LIMIT"""
    if _FORBIDDEN_KEYWORDS.search(sql):
        raise ValueError("SQL 护栏拦截：仅允许 SELECT 查询")

    # 自动补 LIMIT
    if not _HAS_LIMIT.search(sql):
        sql = sql.rstrip().rstrip(";") + f" LIMIT {max_limit}"

    return sql


def _guard_download_sql(sql: str, dataset_id: str) -> str:
    """下载专用 SQL 护栏：额外检查分号、视图名、LIMIT 上限"""
    # 禁止分号
    if ";" in sql:
        raise ValueError("SQL 护栏拦截：下载查询不允许包含分号")

    # 基础护栏（仅 SELECT，自动补 LIMIT 50000）
    sql = _guard_sql(sql, max_limit=50000)

    # 必须查询指定视图
    view_name = f"v_dataset_{dataset_id}"
    if view_name.lower() not in sql.lower():
        raise ValueError(f"SQL 护栏拦截：下载查询必须包含 FROM {view_name}")

    # LIMIT <= 50000
    limit_match = re.search(r"\bLIMIT\s+(\d+)", sql, re.IGNORECASE)
    if limit_match and int(limit_match.group(1)) > 50000:
        raise ValueError("SQL 护栏拦截：下载查询 LIMIT 不得超过 50000")

    return sql


def _execute_sql(sql: str, trace: str, chart: ChartSpec | None = None) -> QueryResponse:
    """执行 SQL 并返回统一 QueryResponse（复用逻辑）"""
    sql = _guard_sql(sql)
    conn = get_conn()
    try:
        t0 = time.perf_counter()
        result = conn.execute(sql)
        columns = [desc[0] for desc in result.description]
        raw_rows = result.fetchall()
        elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)

        rows = [dict(zip(columns, row)) for row in raw_rows]
        logger.info("[%s] SQL=%s elapsed=%.2fms rows=%d", trace, sql, elapsed_ms, len(rows))

        # 如果传入了 chart 模板，填充 data
        if chart is not None:
            chart.data = rows

        return QueryResponse(
            sql=sql,
            rows=rows,
            meta=QueryMeta(trace_id=trace, elapsed_ms=elapsed_ms, row_count=len(rows)),
            chart=chart,
        )
    finally:
        conn.close()


def _build_sql(dataset_id: str, question: str) -> str:
    """根据问题关键词匹配生成 SQL（规则版本，后续接 LLM）"""
    view_name = f"v_dataset_{dataset_id}"

    if _COUNT_KEYWORDS.search(question):
        return f"SELECT COUNT(*) AS row_count FROM {view_name}"

    return f"SELECT * FROM {view_name} LIMIT 50"


# ── Chat Query ──────────────────────────────────────────
def execute_query(dataset_id: str, question: str) -> QueryResponse:
    sql = _build_sql(dataset_id, question)
    chart = ChartSpec(type="table", title="查询结果")
    return _execute_sql(sql, _trace_id(), chart=chart)


# ── Playbook ────────────────────────────────────────────
def execute_playbook(req: PlaybookRequest) -> QueryResponse:
    view = f"v_dataset_{req.dataset_id}"
    tc = req.time_col
    mc = req.metric_col
    dc = req.dim_col

    # 从 manifest 获取聚合配置
    try:
        manifest = get_manifest(req.dataset_id)
        agg = manifest.metric_agg if manifest.metric_agg in _VALID_AGGS else "sum"
        grain = manifest.time_grain if manifest.time_grain in {"day", "week", "month"} else "day"
    except ValueError:
        agg = "sum"
        grain = "day"

    agg_upper = agg.upper()

    if req.playbook == "trend":
        if not tc or not mc:
            raise ValueError("趋势分析需要指定 time_col 和 metric_col")
        sql = (
            f"SELECT date_trunc('{grain}', CAST(\"{tc}\" AS TIMESTAMP)) AS dt, "
            f"{agg_upper}(\"{mc}\") AS value "
            f"FROM {view} "
            f"GROUP BY dt ORDER BY dt"
        )
        chart = ChartSpec(type="line", title="趋势分析", x="dt", y="value")

    elif req.playbook == "topn":
        if not dc or not mc:
            raise ValueError("Top N 分析需要指定 dim_col 和 metric_col")
        sql = (
            f"SELECT \"{dc}\", {agg_upper}(\"{mc}\") AS value "
            f"FROM {view} "
            f"GROUP BY \"{dc}\" ORDER BY value DESC LIMIT 10"
        )
        chart = ChartSpec(type="bar", title="Top N 排行", x=dc, y="value")

    elif req.playbook == "cross":
        if not dc or not tc or not mc:
            raise ValueError("交叉分析需要指定 time_col、metric_col 和 dim_col")
        sql = (
            f"SELECT \"{dc}\", date_trunc('{grain}', CAST(\"{tc}\" AS TIMESTAMP)) AS dt, "
            f"{agg_upper}(\"{mc}\") AS value "
            f"FROM {view} "
            f"GROUP BY \"{dc}\", dt ORDER BY \"{dc}\", dt"
        )
        chart = ChartSpec(type="table", title="交叉分析")

    else:
        raise ValueError(f"未知 playbook 类型: {req.playbook}")

    return _execute_sql(sql, _trace_id(), chart=chart)


# ── 下载 CSV ────────────────────────────────────────────
def execute_download(sql: str, dataset_id: str) -> tuple[list[str], list[tuple]]:
    """执行 SQL 返回 (columns, raw_rows) 用于 CSV 下载"""
    sql = _guard_download_sql(sql, dataset_id)
    conn = get_conn()
    try:
        result = conn.execute(sql)
        columns = [desc[0] for desc in result.description]
        raw_rows = result.fetchall()
        return columns, raw_rows
    finally:
        conn.close()
