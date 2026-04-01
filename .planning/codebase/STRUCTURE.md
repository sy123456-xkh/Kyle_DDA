# Codebase Structure

**Analysis Date:** 2026-04-01

## Directory Layout

```
DDA/
├── backend/                # Python FastAPI service
│   ├── app/
│   │   ├── main.py        # API routes and app entry
│   │   ├── db.py          # DuckDB connection factory
│   │   ├── schemas.py     # Pydantic models
│   │   └── services/      # Business logic layer
│   ├── data/              # Runtime data storage
│   └── requirements.txt   # Python dependencies
├── frontend/              # Next.js React application
│   ├── app/               # Next.js App Router pages
│   │   ├── page.tsx      # Landing page
│   │   ├── layout.tsx    # Root layout
│   │   └── workspace/    # Main workspace UI
│   └── package.json       # Node dependencies
├── .planning/             # GSD codebase documentation
│   └── codebase/         # Architecture and structure docs
├── CLAUDE.md              # Project requirements and instructions
└── PROJECT_MAINTENANCE.md # Maintenance documentation
```

## Directory Purposes

**backend/app/**
- Purpose: FastAPI application code
- Contains: Route handlers, business logic, data models
- Key files: `main.py` (entry), `db.py` (database), `schemas.py` (contracts)

**backend/app/services/**
- Purpose: Business logic separated from API layer
- Contains: Dataset operations, query execution, SQL generation
- Key files: `dataset_service.py`, `query_service.py`

**backend/data/**
- Purpose: Runtime data persistence
- Contains: DuckDB file, uploaded CSVs, manifest JSON files
- Key files: `app.duckdb`, `{dataset_id}.csv`, `{dataset_id}.manifest.json`

**frontend/app/**
- Purpose: Next.js App Router pages and layouts
- Contains: React components, page routes, client-side logic
- Key files: `page.tsx` (landing), `workspace/page.tsx` (main UI), `layout.tsx`

**frontend/app/workspace/**
- Purpose: Main application workspace
- Contains: Single-page workspace component with upload, chat, visualization
- Key files: `page.tsx` (workspace UI)

**.planning/codebase/**
- Purpose: GSD-generated codebase documentation
- Contains: Architecture and structure analysis documents
- Key files: `ARCHITECTURE.md`, `STRUCTURE.md`

## Key File Locations

**Entry Points:**
- `backend/app/main.py`: FastAPI application with route definitions
- `frontend/app/page.tsx`: Landing page entry
- `frontend/app/workspace/page.tsx`: Main workspace application

**Configuration:**
- `backend/requirements.txt`: Python dependencies (FastAPI, DuckDB, Pydantic)
- `frontend/package.json`: Node dependencies (Next.js, React, ECharts)
- `frontend/next.config.ts`: Next.js configuration
- `frontend/tailwind.config.ts`: Tailwind CSS configuration
- `frontend/tsconfig.json`: TypeScript configuration

**Core Logic:**
- `backend/app/services/dataset_service.py`: CSV upload, profiling, manifest management
- `backend/app/services/query_service.py`: Query execution, SQL generation, guardrails
- `backend/app/db.py`: DuckDB connection management
- `backend/app/schemas.py`: Request/response models

**Testing:**
- Not present (MVP scope - no tests yet)

## Naming Conventions

**Files:**
- Python: `snake_case.py` (e.g., `dataset_service.py`, `query_service.py`)
- TypeScript: `kebab-case.tsx` or `page.tsx` (Next.js convention)
- Config: `lowercase.config.ts` or `UPPERCASE.md`

**Directories:**
- Lowercase with hyphens or underscores: `app/`, `services/`, `workspace/`

**Database Objects:**
- Tables: `dataset_{dataset_id}` (e.g., `dataset_ds_249058a8`)
- Views: `v_dataset_{dataset_id}` (e.g., `v_dataset_ds_249058a8`)
- Dataset IDs: `ds_{8_hex_chars}` (e.g., `ds_249058a8`)

**API Endpoints:**
- RESTful: `/datasets/{id}/profile`, `/chat/query`, `/playbook`
- Lowercase with hyphens for multi-word resources

## Where to Add New Code

**New API Endpoint:**
- Primary code: `backend/app/main.py` (route handler)
- Business logic: `backend/app/services/{domain}_service.py`
- Request/response models: `backend/app/schemas.py`
- Tests: Not applicable (no test structure yet)

**New Service Function:**
- Implementation: `backend/app/services/{domain}_service.py`
- Import in: `backend/app/main.py`
- Models: `backend/app/schemas.py`

**New Frontend Page:**
- Implementation: `frontend/app/{route}/page.tsx`
- Shared components: Consider extracting to `frontend/components/` (not yet created)

**New Frontend Feature:**
- Implementation: `frontend/app/workspace/page.tsx` (currently monolithic)
- API calls: Inline fetch calls with `${API}/endpoint` pattern
- Types: Inline TypeScript interfaces at top of file

**Utilities:**
- Backend: Add to relevant service file (no shared utils module yet)
- Frontend: Add to page file (no shared utils module yet)

## Special Directories

**backend/data/**
- Purpose: Runtime data storage for DuckDB and uploaded files
- Generated: Yes (created on first upload)
- Committed: No (should be in .gitignore)

**frontend/.next/**
- Purpose: Next.js build output and cache
- Generated: Yes (created on `npm run dev` or `npm run build`)
- Committed: No (in .gitignore)

**backend/.venv/**
- Purpose: Python virtual environment
- Generated: Yes (created via `python -m venv .venv`)
- Committed: No (should be in .gitignore)

**.planning/**
- Purpose: GSD codebase analysis and planning documents
- Generated: Yes (by GSD commands)
- Committed: Yes (documentation for project context)

## File Organization Patterns

**Backend Services:**
- Each service file handles one domain (datasets, queries)
- Private helper functions prefixed with `_` (e.g., `_safe_id()`, `_guard_sql()`)
- Public functions exported for use in `main.py`

**Frontend Components:**
- Monolithic workspace component in `workspace/page.tsx`
- Inline helper functions and types at file top
- State management via React hooks (useState, useEffect, useRef)

**Data Persistence:**
- CSV files: `backend/data/{dataset_id}.csv`
- Manifest files: `backend/data/{dataset_id}.manifest.json`
- DuckDB file: `backend/data/app.duckdb` (single shared database)

---

*Structure analysis: 2026-04-01*
