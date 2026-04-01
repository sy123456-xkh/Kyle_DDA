# External Integrations

**Analysis Date:** 2026-04-01

## APIs & External Services

**LLM Services:**
- Anthropic Claude API - Planned for natural language to SQL generation
  - SDK/Client: Not yet implemented
  - Auth: `ANTHROPIC_API_KEY` (env var, commented in `.env.example`)
  - Status: Placeholder only, not currently integrated

## Data Storage

**Databases:**
- DuckDB (embedded)
  - Connection: Local file at `backend/data/app.duckdb`
  - Client: `duckdb` Python library (1.1.3)
  - Purpose: In-process OLAP analytics engine
  - Tables: `dataset_{id}` (one per uploaded CSV)
  - Views: `v_dataset_{id}` (one per dataset)

**File Storage:**
- Local filesystem only
  - CSV uploads: `backend/data/{dataset_id}.csv`
  - DuckDB database: `backend/data/app.duckdb`

**Caching:**
- None

## Authentication & Identity

**Auth Provider:**
- None (MVP stage)
  - Implementation: No authentication required
  - Access: Open API endpoints with CORS enabled for all origins

## Monitoring & Observability

**Error Tracking:**
- None

**Logs:**
- Python `logging` module (INFO level)
- Format: `%(asctime)s %(levelname)s %(message)s`
- Output: Console/stdout

## CI/CD & Deployment

**Hosting:**
- Local development only (no production deployment)

**CI Pipeline:**
- None

## Environment Configuration

**Required env vars:**
- Frontend: `NEXT_PUBLIC_API_BASE` (default: `http://127.0.0.1:8000`)
- Backend: None currently required

**Secrets location:**
- `.env` files (not committed, `.env.example` templates provided)
- Future: `ANTHROPIC_API_KEY` for LLM integration

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Frontend-Backend Communication

**API Protocol:**
- REST over HTTP
- CORS: Enabled for all origins (development mode)
- Content-Type: `application/json` for most endpoints, `multipart/form-data` for uploads, `text/csv` for downloads

**Key Endpoints:**
- `POST /datasets/upload` - CSV file upload
- `GET /datasets/{id}/profile` - Dataset profiling
- `GET /datasets/{id}/manifest` - Dataset metadata
- `PUT /datasets/{id}/manifest` - Update metadata
- `POST /chat/query` - Natural language query
- `POST /playbook` - Execute analysis playbook
- `GET /datasets/{id}/download` - Export query results as CSV

---

*Integration audit: 2026-04-01*
