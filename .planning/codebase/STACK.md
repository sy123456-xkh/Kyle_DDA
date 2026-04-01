# Technology Stack

**Analysis Date:** 2026-04-01

## Languages

**Primary:**
- Python 3.9+ - Backend API and data processing
- TypeScript 5.7.0 - Frontend application

**Secondary:**
- SQL - DuckDB queries for data analysis

## Runtime

**Environment:**
- Python 3.9.6+ (backend)
- Node.js v25.6.1 (frontend)

**Package Manager:**
- pip (Python) - Backend dependencies
- npm (Node.js) - Frontend dependencies
- Lockfile: `package-lock.json` present for frontend

## Frameworks

**Core:**
- FastAPI 0.115.6 - Backend REST API framework
- Next.js 15.1.0 - Frontend React framework (App Router)
- React 19.0.0 - UI library

**Testing:**
- Not detected

**Build/Dev:**
- Uvicorn 0.34.0 - ASGI server for FastAPI
- TypeScript 5.7.0 - Type checking and compilation
- Tailwind CSS 3.4.16 - Utility-first CSS framework
- PostCSS 8.4.49 - CSS processing
- Autoprefixer 10.4.20 - CSS vendor prefixing

## Key Dependencies

**Critical:**
- duckdb 1.1.3 - In-process SQL OLAP database engine for analytics
- pydantic 2.10.4 - Data validation and settings management
- python-multipart 0.0.19 - Multipart form data parsing for file uploads

**Infrastructure:**
- echarts 5.6.0 - Data visualization and charting library

## Configuration

**Environment:**
- Backend: `.env` file (optional, currently minimal)
  - Future: `ANTHROPIC_API_KEY` for LLM integration
- Frontend: `.env` file with `NEXT_PUBLIC_API_BASE` for API endpoint
- Default backend: `http://127.0.0.1:8000`
- Default frontend: `http://localhost:3000`

**Build:**
- `backend/requirements.txt` - Python dependencies
- `frontend/package.json` - Node.js dependencies
- `frontend/tsconfig.json` - TypeScript compiler options
- `frontend/tailwind.config.ts` - Tailwind CSS configuration
- `frontend/next.config.ts` - Next.js configuration (minimal)

## Platform Requirements

**Development:**
- macOS (primary development platform)
- Python 3.9+ with venv support
- Node.js 25+ with npm
- Local filesystem access for DuckDB storage

**Production:**
- Not yet configured (MVP stage)
- Target: Local development/demo environment

---

*Stack analysis: 2026-04-01*
