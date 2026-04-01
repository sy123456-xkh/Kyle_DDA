# Coding Conventions

**Analysis Date:** 2026-04-01

## Naming Patterns

**Files:**
- Python: snake_case for modules (`dataset_service.py`, `query_service.py`, `main.py`)
- TypeScript/React: PascalCase for components (`WorkspacePage`, `LandingPage`)
- Config files: lowercase with dots (`tsconfig.json`, `next.config.ts`, `requirements.txt`)

**Functions:**
- Python: snake_case (`upload_csv`, `profile_dataset`, `execute_query`, `get_manifest`)
- TypeScript: camelCase (`handleUpload`, `updateManifest`, `runPlaybook`, `copySQL`)
- Private/internal Python functions: leading underscore (`_safe_id`, `_guard_sql`, `_trace_id`, `_build_sql`)

**Variables:**
- Python: snake_case (`dataset_id`, `view_name`, `row_count`, `csv_path`)
- TypeScript: camelCase (`datasetId`, `activeResult`, `chartSpec`, `querying`)
- Constants: SCREAMING_SNAKE_CASE (`DATA_DIR`, `DB_PATH`, `API`)
- Regex patterns: leading underscore + CAPS (`_FORBIDDEN_KEYWORDS`, `_COUNT_KEYWORDS`, `_HAS_LIMIT`)

**Types:**
- Python: PascalCase Pydantic models (`UploadResponse`, `ProfileResponse`, `QueryRequest`, `ChartSpec`)
- TypeScript: PascalCase interfaces (`ColumnInfo`, `QueryResult`, `ChatMessage`, `HistoryEntry`)

## Code Style

**Formatting:**
- Python: No explicit formatter config detected (follows PEP 8 conventions)
- TypeScript: Prettier implied (via Next.js defaults)
- Indentation: 2 spaces (TypeScript), 4 spaces (Python)
- Line length: ~100 chars (Python), ~120 chars (TypeScript)

**Linting:**
- TypeScript: ESLint via Next.js defaults
- Python: No explicit linter config (manual adherence to conventions)
- TypeScript uses `eslint-disable` comments sparingly (e.g., `// eslint-disable-next-line @typescript-eslint/no-explicit-any`)

## Import Organization

**Python Order:**
1. Standard library (`import os`, `import re`, `import time`, `import uuid`, `import logging`)
2. Third-party packages (`from fastapi import ...`, `from pydantic import ...`, `import duckdb`)
3. Local modules (`from app.db import ...`, `from app.schemas import ...`, `from app.services import ...`)

**TypeScript Order:**
1. React/Next.js (`import { useState, useRef } from "react"`, `import Link from "next/link"`)
2. Third-party libraries (`import("echarts")`)
3. Local modules (none detected - all code in single files)

**Path Aliases:**
- TypeScript: `@/*` maps to project root (configured in `tsconfig.json`)
- Python: Relative imports from `app` package

## Error Handling

**Python Patterns:**
- Use try/finally for resource cleanup (DuckDB connections)
- Raise `ValueError` for business logic errors (invalid dataset, SQL guardrail violations)
- Raise `HTTPException` in FastAPI routes with appropriate status codes (400, 403, 404, 500)
- String matching for error detection (`"does not exist" in error_msg`)

**TypeScript Patterns:**
- Try/catch for async operations (fetch calls)
- Check `res.ok` before parsing JSON
- Display user-friendly error messages in UI
- Silent failures for non-critical operations (localStorage, `catch { /* ignore */ }`)

## Logging

**Framework:** Python `logging` module

**Patterns:**
- Configure at module level: `logging.basicConfig(level=logging.INFO, format="...")`
- Use module-level logger: `logger = logging.getLogger("chat-to-bi")`
- Log query execution: `logger.info("[%s] SQL=%s elapsed=%.2fms rows=%d", trace, sql, elapsed_ms, len(rows))`
- No logging in TypeScript frontend

## Comments

**When to Comment:**
- Section dividers in Python: `# ── Upload ──────────────────────────────────────────────`
- Docstrings for modules: `"""Module purpose and key responsibilities"""`
- Inline explanations for complex logic (SQL guardrails, regex patterns)
- TypeScript: Minimal comments, rely on descriptive names

**JSDoc/TSDoc:**
- Not used in this codebase
- Type information provided via TypeScript interfaces

## Function Design

**Size:**
- Python: 10-50 lines typical, up to 100 for complex UI logic
- TypeScript: React components 50-700 lines (single-file components)
- Helper functions: 5-20 lines

**Parameters:**
- Python: 1-3 parameters typical, use Pydantic models for complex requests
- TypeScript: Destructured props for React components, 0-2 params for handlers
- Use keyword arguments in Python for clarity

**Return Values:**
- Python: Pydantic models for API responses (`UploadResponse`, `ProfileResponse`, `QueryResponse`)
- Python: Tuples for internal functions (`tuple[list[str], list[tuple]]`)
- TypeScript: Explicit return types via interfaces, `void` for handlers

## Module Design

**Exports:**
- Python: No explicit `__all__`, all public functions exported by default
- TypeScript: `export default` for page components, named exports for utilities

**Barrel Files:**
- Python: `__init__.py` files present but empty (no re-exports)
- TypeScript: Not used

## Database Patterns

**Connection Management:**
- Use `get_conn()` to obtain DuckDB connection
- Always use try/finally to close connections
- Pattern: `conn = get_conn(); try: ...; finally: conn.close()`

**SQL Construction:**
- Use f-strings for SQL generation (no ORM)
- Quote column names with double quotes: `"{col.name}"`
- Table naming: `dataset_{id}`, view naming: `v_dataset_{id}`

## React Patterns

**State Management:**
- `useState` for local component state
- `useRef` for DOM references and mutable values
- `useEffect` for side effects (localStorage, auto-scroll, chart rendering)
- `useCallback` for memoized handlers

**Styling:**
- Tailwind CSS utility classes
- CSS custom properties for theming (`var(--bg-primary)`, `var(--text-secondary)`)
- Inline styles for dynamic values (`style={{ width: "100%" }}`)

## API Communication

**Pattern:**
- Construct API URL: `${API}/endpoint`
- Use `fetch` with async/await
- Check `res.ok` before parsing
- Handle errors with user-friendly messages
- POST requests: `Content-Type: application/json`
- File uploads: `FormData` with `multipart/form-data`

---

*Convention analysis: 2026-04-01*
