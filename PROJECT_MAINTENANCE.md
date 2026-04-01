# Chat-to-BI MVP 项目维护文档

> **文档版本**: v1.0
> **最后更新**: 2026-03-27
> **项目状态**: MVP 已完成 Step1-3，可运行

---

## 📋 目录

1. [项目概览](#项目概览)
2. [技术栈](#技术栈)
3. [目录结构](#目录结构)
4. [后端模块详解](#后端模块详解)
5. [前端模块详解](#前端模块详解)
6. [API 接口文档](#api-接口文档)
7. [数据流程](#数据流程)
8. [已完成功能清单](#已完成功能清单)
9. [待开发功能清单](#待开发功能清单)
10. [常见问题排查](#常见问题排查)
11. [开发指南](#开发指南)

---

## 项目概览

### 项目目标
实现一个面试展示用的 Chat-to-BI 控制台 MVP，核心流程：
```
上传 CSV → 字段解析(profile/manifest) → 自然语言提问 → 生成 SQL(护栏) → DuckDB 执行 → 返回结果/图表/洞察
```

### 核心特性
- ✅ CSV 文件上传与自动建表
- ✅ 数据字段 Profiling（行数、类型、缺失率、样例值）
- ✅ Manifest 配置（时间列、指标列、聚合方式）
- ✅ 自然语言查询（规则匹配版本）
- ✅ SQL 护栏（防注入、自动限制行数）
- ✅ Playbook 快速分析（趋势、Top N、交叉分析）
- ✅ 图表可视化（ECharts：折线图、柱状图、表格）
- ✅ 查询历史记录
- ✅ CSV 结果下载

### 设计约束
- 单机运行（macOS 开发环境）
- 不做多租户/企业级审计
- 最小错误处理 + 最小可观测
- 严格分阶段交付，禁止随意重构

---

## 技术栈

### 后端
- **语言**: Python 3.11
- **框架**: FastAPI 0.115.6
- **数据库**: DuckDB 1.1.3（本地文件 `backend/data/app.duckdb`）
- **服务器**: Uvicorn 0.34.0
- **依赖管理**: pip + requirements.txt

### 前端
- **框架**: Next.js 15.1.0 (App Router)
- **语言**: TypeScript 5.7.0
- **UI**: Tailwind CSS 3.4.16
- **图表**: ECharts 5.6.0
- **包管理**: npm

---

## 目录结构

```
DDA/
├── backend/                    # 后端服务
│   ├── app/
│   │   ├── main.py            # FastAPI 入口，路由定义
│   │   ├── db.py              # DuckDB 连接管理
│   │   ├── schemas.py         # Pydantic 数据模型
│   │   └── services/          # 业务逻辑层
│   │       ├── dataset_service.py   # 数据集上传、profiling、manifest
│   │       └── query_service.py     # 查询、playbook、SQL 护栏
│   ├── data/                  # 数据存储目录
│   │   ├── app.duckdb         # DuckDB 数据库文件
│   │   ├── *.csv              # 上传的 CSV 文件
│   │   └── *.manifest.json    # Manifest 配置文件
│   ├── requirements.txt       # Python 依赖
│   ├── .env.example           # 环境变量模板
│   └── README.md              # 后端启动说明
│
├── frontend/                  # 前端应用
│   ├── app/
│   │   ├── page.tsx           # 首页（Landing Page）
│   │   ├── layout.tsx         # 全局布局
│   │   ├── globals.css        # 全局样式
│   │   └── workspace/
│   │       └── page.tsx       # 主工作台（三栏布局）
│   ├── public/                # 静态资源
│   ├── package.json           # 前端依赖
│   ├── .env.example           # 环境变量模板
│   └── README.md              # 前端启动说明
│
├── claude.md                  # 项目需求文档（CLAUDE.md）
├── PROJECT_MAINTENANCE.md     # 本维护文档
└── .gitignore
```

---

## 后端模块详解

### 1. main.py - FastAPI 入口与路由

**文件路径**: `backend/app/main.py`

**职责**: 定义所有 HTTP 路由，处理请求/响应，错误处理

**已实现路由**:

| 方法 | 路径 | 功能 | 状态 |
|------|------|------|------|
| POST | `/datasets/upload` | 上传 CSV 文件 | ✅ |
| GET | `/datasets/{id}/profile` | 获取数据集 profiling | ✅ |
| GET | `/datasets/{id}/manifest` | 获取 manifest 配置 | ✅ |
| PUT | `/datasets/{id}/manifest` | 更新 manifest 配置 | ✅ |
| POST | `/chat/query` | 自然语言查询 | ✅ |
| POST | `/playbook` | 执行预定义分析 | ✅ |
| GET | `/datasets/{id}/download` | 下载查询结果 CSV | ✅ |

**关键配置**:
```python
# CORS 配置（开发阶段全部允许）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**错误处理模式**:
- 400: 客户端请求错误（如文件格式不对）
- 403: SQL 护栏拦截
- 404: 数据集不存在
- 500: 服务器内部错误

---

### 2. db.py - DuckDB 连接管理

**文件路径**: `backend/app/db.py`

**职责**: 提供全局 DuckDB 连接，确保所有请求复用同一个数据库文件

**核心函数**:
```python
def get_conn() -> duckdb.DuckDBPyConnection:
    """返回到 backend/data/app.duckdb 的连接（线程安全模式）"""
    return duckdb.connect(DB_PATH, read_only=False)
```

**设计要点**:
- 每次请求创建新连接，用完立即关闭（避免锁问题）
- 数据库文件路径: `backend/data/app.duckdb`
- 非只读模式，支持 CREATE/INSERT 操作

**注意事项**:
- DuckDB 是嵌入式数据库，不支持高并发写入
- 生产环境需考虑连接池或改用客户端-服务器模式

---

### 3. schemas.py - Pydantic 数据模型

**文件路径**: `backend/app/schemas.py`

**职责**: 定义所有请求/响应的数据结构，提供自动校验和文档生成

**核心模型**:

#### 上传相关
```python
class UploadResponse(BaseModel):
    dataset_id: str  # 生成的数据集 ID（如 ds_20dca793）
```

#### Profiling 相关
```python
class ProfileResponse(BaseModel):
    row_count: int                      # 总行数
    columns: list[ColumnInfo]           # 列名和类型
    missing_rate: list[MissingRate]     # 缺失率（0~1）
    sample_values: list[SampleValues]   # 前 5 个非空样例值
```

#### Manifest 相关
```python
class ManifestResponse(BaseModel):
    dataset_id: str
    view_name: str | None               # 视图名（v_dataset_{id}）
    primary_time_col: str | None        # 主时间列
    metric_col: str | None              # 主指标列
    metric_agg: str = "sum"             # 聚合方式（sum/avg/count）
    time_grain: str = "day"             # 时间粒度（day/week/month）
    dimension_candidates: list[str]     # 维度候选列
    metric_candidates: list[str]        # 指标候选列
```

#### 查询相关
```python
class QueryRequest(BaseModel):
    dataset_id: str
    question: str  # 自然语言问题

class QueryResponse(BaseModel):
    sql: str                    # 生成的 SQL
    rows: list[dict]            # 查询结果
    meta: QueryMeta             # 元数据（trace_id, elapsed_ms, row_count）
    chart: ChartSpec | None     # 图表配置（可选）
```

#### Playbook 相关
```python
class PlaybookRequest(BaseModel):
    dataset_id: str
    playbook: str               # "trend" | "topn" | "cross"
    time_col: str | None        # 时间列（trend/cross 必需）
    metric_col: str | None      # 指标列（所有 playbook 必需）
    dim_col: str | None         # 维度列（topn/cross 必需）
```

---

### 4. dataset_service.py - 数据集业务逻辑

**文件路径**: `backend/app/services/dataset_service.py`

**职责**: CSV 上传、DuckDB 建表、Profiling、Manifest 管理

#### 核心函数

##### 4.1 upload_csv()
```python
def upload_csv(filename: str, content: bytes) -> UploadResponse
```
**功能**: 上传 CSV 文件并在 DuckDB 中建表和视图

**流程**:
1. 生成安全的 dataset_id（格式: `ds_xxxxxxxx`，仅字母数字下划线）
2. 保存 CSV 到 `backend/data/{dataset_id}.csv`
3. 在 DuckDB 中执行:
   - `CREATE TABLE dataset_{id} AS SELECT * FROM read_csv_auto(...)`
   - `CREATE VIEW v_dataset_{id} AS SELECT * FROM dataset_{id}`
4. 自动生成初始 manifest（推断时间列和指标列）
5. 返回 dataset_id

**关键代码**:
```python
def _safe_id() -> str:
    """生成可直接用作 DuckDB 表名的短 ID"""
    return "ds_" + re.sub(r"[^a-z0-9]", "", uuid.uuid4().hex[:8])
```

##### 4.2 profile_dataset()
```python
def profile_dataset(dataset_id: str) -> ProfileResponse
```
**功能**: 使用纯 SQL 完成数据集 profiling（不依赖 pandas）

**返回内容**:
- `row_count`: 总行数
- `columns`: 列名和类型列表
- `missing_rate`: 每列缺失率（0~1）
- `sample_values`: 每列前 5 个非空样例值

**实现方式**:
```sql
-- 获取列信息
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'dataset_{id}'

-- 计算缺失率
SELECT 
  COUNT(*) FILTER (WHERE "{col}" IS NULL) * 1.0 / COUNT(*) AS missing_rate
FROM dataset_{id}

-- 获取样例值
SELECT DISTINCT "{col}" FROM dataset_{id} 
WHERE "{col}" IS NOT NULL LIMIT 5
```

##### 4.3 Manifest 管理
```python
def get_manifest(dataset_id: str) -> ManifestResponse
def update_manifest(dataset_id: str, body: ManifestUpdate) -> ManifestResponse
```

**Manifest 存储方式**:
- 文件路径: `backend/data/{dataset_id}.manifest.json`
- 内存缓存: `_manifests_cache` 字典（加速读取）
- 持久化: 每次更新写入 JSON 文件

**自动推断逻辑**:
- **时间列**: 列名包含 `date|time|日期|时间|month|year|day|week`
- **指标列**: 数值类型（BIGINT, INTEGER, DOUBLE, FLOAT, DECIMAL 等）
- **维度列**: 非时间、非指标的其他列

**Manifest 字段说明**:
- `primary_time_col`: 主时间列（用于趋势分析）
- `metric_col`: 主指标列（用于聚合计算）
- `metric_agg`: 聚合方式（sum/avg/count，默认 sum）
- `time_grain`: 时间粒度（day/week/month，默认 day）
- `dimension_candidates`: 维度候选列表
- `metric_candidates`: 指标候选列表

---

### 5. query_service.py - 查询与 SQL 护栏

**文件路径**: `backend/app/services/query_service.py`

**职责**: 自然语言查询、SQL 护栏、Playbook 执行、CSV 下载

#### 核心函数

##### 5.1 SQL 护栏机制

**_guard_sql()** - 基础护栏
```python
def _guard_sql(sql: str, max_limit: int = 5000) -> str
```
**保护措施**:
1. 禁止非 SELECT 语句（INSERT/UPDATE/DELETE/DROP/ALTER/CREATE/TRUNCATE 等）
2. 自动补充 LIMIT（如果 SQL 中没有 LIMIT，自动添加 `LIMIT 5000`）
3. 已有 LIMIT 则保持不变

**实现**:
```python
_FORBIDDEN_KEYWORDS = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|REPLACE|MERGE|GRANT|REVOKE)\b",
    re.IGNORECASE,
)
```

**_guard_download_sql()** - 下载专用护栏
```python
def _guard_download_sql(sql: str, dataset_id: str) -> str
```
**额外保护**:
1. 禁止分号（防止多语句注入）
2. 必须查询指定视图 `v_dataset_{id}`
3. LIMIT 上限 50000 行
4. 继承基础护栏的所有规则

##### 5.2 execute_query() - 自然语言查询

**功能**: 接收自然语言问题，生成 SQL 并执行

**当前实现**（规则匹配版本）:
```python
def _build_sql(dataset_id: str, question: str) -> str:
    view_name = f"v_dataset_{dataset_id}"
    
    # 规则 1: 计数类问题
    if re.search(r"行数|count|多少行|总数|总共|有几", question, re.IGNORECASE):
        return f"SELECT COUNT(*) AS row_count FROM {view_name}"
    
    # 规则 2: 默认查询
    return f"SELECT * FROM {view_name} LIMIT 50"
```

**返回结果**:
- `sql`: 生成的 SQL 语句
- `rows`: 查询结果（字典列表）
- `meta`: 元数据（trace_id, elapsed_ms, row_count）
- `chart`: 图表配置（默认 table 类型）

**后续扩展点**:
- 🔄 接入 Claude API 进行智能 SQL 生成
- 🔄 支持更复杂的自然语言理解
- 🔄 支持多表 JOIN 查询

##### 5.3 execute_playbook() - 预定义分析

**功能**: 执行三种预定义分析模式

**Playbook 类型**:

1. **trend** - 趋势分析
   - 必需参数: `time_col`, `metric_col`
   - SQL 模板:
   ```sql
   SELECT date_trunc('{grain}', CAST("{time_col}" AS TIMESTAMP)) AS dt,
          {AGG}("{metric_col}") AS value
   FROM v_dataset_{id}
   GROUP BY dt ORDER BY dt
   ```
   - 图表类型: `line`（折线图）

2. **topn** - Top N 排行
   - 必需参数: `dim_col`, `metric_col`
   - SQL 模板:
   ```sql
   SELECT "{dim_col}", {AGG}("{metric_col}") AS value
   FROM v_dataset_{id}
   GROUP BY "{dim_col}" ORDER BY value DESC LIMIT 10
   ```
   - 图表类型: `bar`（柱状图）

3. **cross** - 交叉分析
   - 必需参数: `time_col`, `metric_col`, `dim_col`
   - SQL 模板:
   ```sql
   SELECT "{dim_col}", 
          date_trunc('{grain}', CAST("{time_col}" AS TIMESTAMP)) AS dt,
          {AGG}("{metric_col}") AS value
   FROM v_dataset_{id}
   GROUP BY "{dim_col}", dt ORDER BY "{dim_col}", dt
   ```
   - 图表类型: `table`（表格）

**聚合方式**:
- 从 manifest 读取 `metric_agg`（sum/avg/count）
- 默认使用 `sum`

**时间粒度**:
- 从 manifest 读取 `time_grain`（day/week/month）
- 默认使用 `day`

##### 5.4 execute_download() - CSV 下载

**功能**: 执行 SQL 并返回原始数据用于 CSV 导出

**返回**: `(columns: list[str], raw_rows: list[tuple])`

**护栏**: 使用 `_guard_download_sql()` 进行严格检查

---
