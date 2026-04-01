# Architecture

**Analysis Date:** 2026-04-01

## Pattern Overview

**Overall:** Three-tier architecture with REST API separation

**Key Characteristics:**
- Backend: Python FastAPI service with DuckDB embedded analytics
- Frontend: Next.js React SPA with client-side state management
- Data Layer: DuckDB file-based database with CSV ingestion
- Communication: RESTful JSON API over HTTP

## Layers

**Presentation Layer:**
- Purpose: User interface for data upload, chat interaction, and visualization
- Location: `frontend/app/`
- Contains: React components, API client logic, ECharts visualization
- Depends on: Backend REST API (`/datasets`, `/chat`, `/playbook`)
- Used by: End users via browser

**API Layer:**
- Purpose: HTTP endpoint routing and request/response handling
- Location: `backend/app/main.py`
- Contains: FastAPI route handlers, CORS middleware, error handling
- Depends on: Service layer (`dataset_service`, `query_service`)
- Used by: Frontend via fetch API

**Service Layer:**
- Purpose: Business logic for dataset management and query execution
- Location: `backend/app/services/`
- Contains: Dataset operations, SQL generation, guardrails, manifest management
- Depends on: Database layer (`db.py`), schemas (`schemas.py`)
- Used by: API layer

**Data Layer:**
- Purpose: DuckDB connection management and SQL execution
- Location: `backend/app/db.py`, `backend/data/`
- Contains: Connection factory, DuckDB file (`app.duckdb`), CSV files, manifest JSON
- Depends on: DuckDB Python driver
- Used by: Service layer

## Data Flow

**CSV Upload Flow:**

1. User uploads CSV via `frontend/app/workspace/page.tsx`
2. Frontend POSTs multipart file to `/datasets/upload`
3. `backend/app/main.py` routes to `upload_csv()` in `dataset_service.py`
4. Service generates dataset_id, saves CSV to `backend/data/{id}.csv`
5. DuckDB creates table `dataset_{id}` and view `v_dataset_{id}`
6. Service auto-generates manifest with inferred time/metric columns
7. Manifest saved to `backend/data/{id}.manifest.json`
8. Returns `{dataset_id}` to frontend

**Query Flow:**

1. User enters question in chat input
2. Frontend POSTs `{dataset_id, question}` to `/chat/query`
3. `query_service.py` matches keywords to generate SQL (rule-based)
4. SQL passes through `_guard_sql()` (blocks non-SELECT, adds LIMIT)
5. DuckDB executes SQL via `get_conn()`
6. Results formatted as `{sql, rows, meta, chart}` with ChartSpec
7. Frontend displays results in right panel with ECharts visualization

**Playbook Flow:**

1. User clicks playbook button (trend/topn/cross)
2. Frontend POSTs `{dataset_id, playbook, time_col, metric_col, dim_col}` to `/playbook`
3. `query_service.py` loads manifest for aggregation config
4. Generates SQL based on playbook type (GROUP BY with date_trunc/aggregation)
5. Executes via `_execute_sql()` with chart template
6. Returns structured response with chart type and data

**State Management:**
- Frontend: React useState hooks for local state, localStorage for history
- Backend: Stateless API with file-based persistence (DuckDB, JSON manifests)
- Manifest cache: In-memory dict `_manifests_cache` for performance

## Key Abstractions

**Dataset:**
- Purpose: Represents uploaded CSV with metadata and query interface
- Examples: `backend/data/ds_249058a8.csv`, `backend/data/ds_249058a8.manifest.json`
- Pattern: ID-based file naming, paired CSV + manifest + DuckDB table/view

**Manifest:**
- Purpose: Stores user-configured metadata for intelligent query generation
- Examples: `backend/app/schemas.py` (ManifestResponse), `dataset_service.py` (_save_manifest)
- Pattern: JSON file persistence with in-memory caching, auto-inference on upload

**ChartSpec:**
- Purpose: Declarative chart configuration passed from backend to frontend
- Examples: `backend/app/schemas.py` (ChartSpec), `frontend/app/workspace/page.tsx` (ECharts rendering)
- Pattern: Type-based rendering (line/bar/table) with data payload

**SQL Guardrails:**
- Purpose: Security layer preventing destructive SQL operations
- Examples: `backend/app/services/query_service.py` (_guard_sql, _FORBIDDEN_KEYWORDS)
- Pattern: Regex-based keyword blocking, automatic LIMIT injection

## Entry Points

**Frontend Entry:**
- Location: `frontend/app/page.tsx`
- Triggers: User navigates to root URL
- Responsibilities: Landing page with navigation to `/workspace`

**Workspace Entry:**
- Location: `frontend/app/workspace/page.tsx`
- Triggers: User navigates to `/workspace`
- Responsibilities: Main application UI, API orchestration, state management

**Backend Entry:**
- Location: `backend/app/main.py`
- Triggers: Uvicorn starts FastAPI app
- Responsibilities: Route registration, middleware setup, request handling

## Error Handling

**Strategy:** HTTP status codes with JSON error responses

**Patterns:**
- Service layer raises `ValueError` for business logic errors
- API layer catches exceptions and maps to HTTP status (400/403/404/500)
- Frontend displays error messages in chat or upload UI
- SQL guardrails raise `ValueError` with descriptive messages
- DuckDB errors caught and wrapped with context (e.g., "数据集不存在")

## Cross-Cutting Concerns

**Logging:** Python `logging` module with INFO level, trace_id in query metadata

**Validation:** Pydantic models for request/response validation at API boundary

**Authentication:** None (MVP scope - no auth layer)

---

*Architecture analysis: 2026-04-01*
