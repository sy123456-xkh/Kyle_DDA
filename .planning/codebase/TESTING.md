# Testing Patterns

**Analysis Date:** 2026-04-01

## Test Framework

**Runner:**
- Not configured
- No test framework detected in `backend/requirements.txt` or `frontend/package.json`

**Assertion Library:**
- None

**Run Commands:**
```bash
# No test commands available
```

## Test File Organization

**Location:**
- No test files found in project directories
- Only test files present are in `node_modules` (third-party dependencies)

**Naming:**
- No established pattern (no tests exist)

**Structure:**
```
No test directory structure exists
```

## Test Structure

**Suite Organization:**
```
No test suites defined
```

**Patterns:**
- No testing patterns established

## Mocking

**Framework:** None

**Patterns:**
```
No mocking patterns defined
```

**What to Mock:**
- DuckDB connections (when tests are added)
- File system operations (CSV uploads)
- FastAPI HTTP clients
- External API calls (future LLM integration)

**What NOT to Mock:**
- Pydantic model validation
- Pure functions (SQL string construction)
- React component rendering logic

## Fixtures and Factories

**Test Data:**
```
No fixtures defined
```

**Location:**
- No fixture directory exists

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
# No coverage tooling configured
```

## Test Types

**Unit Tests:**
- Not implemented
- Recommended scope: SQL guardrail functions (`_guard_sql`, `_guard_download_sql`), ID generation (`_safe_id`), manifest inference logic

**Integration Tests:**
- Not implemented
- Recommended scope: API endpoints (`/datasets/upload`, `/chat/query`, `/playbook`), DuckDB query execution, CSV parsing

**E2E Tests:**
- Not implemented
- Recommended framework: Playwright or Cypress for frontend workflows

## Common Patterns

**Async Testing:**
```python
# Pattern not established - would use pytest-asyncio when implemented
```

**Error Testing:**
```python
# Pattern not established - would use pytest.raises when implemented
```

## Testing Gaps

**Backend (`backend/`):**
- No tests for `app/services/dataset_service.py` (upload, profile, manifest logic)
- No tests for `app/services/query_service.py` (SQL guardrails, query execution, playbook generation)
- No tests for `app/main.py` (API endpoint integration)
- No tests for `app/db.py` (connection management)

**Frontend (`frontend/`):**
- No tests for `app/workspace/page.tsx` (main workspace component)
- No tests for `app/page.tsx` (landing page)
- No component unit tests
- No integration tests for API communication

## Recommended Testing Setup

**Backend:**
```bash
# Add to requirements.txt
pytest==8.0.0
pytest-asyncio==0.23.0
httpx==0.27.0  # For FastAPI TestClient
```

**Frontend:**
```bash
# Add to package.json devDependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
```

**Critical Test Priorities:**
1. SQL guardrail validation (`_guard_sql`, `_guard_download_sql`) - prevents SQL injection
2. Dataset upload and table creation - core functionality
3. Query execution with LIMIT enforcement - prevents resource exhaustion
4. Manifest persistence and retrieval - data integrity
5. API error handling - user experience

---

*Testing analysis: 2026-04-01*
