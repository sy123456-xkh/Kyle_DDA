"""Chat-to-BI MVP — FastAPI 入口"""

import csv
import io
import logging

from fastapi import FastAPI, File, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from app.exceptions import DatasetNotFoundError, FileValidationError, SQLGuardrailError
from app.config import settings
from app.db import init_metadata_tables

from app.schemas import (
    ErrorResponse,
    ManifestResponse,
    ManifestUpdate,
    PlaybookRequest,
    ProfileResponse,
    QueryRequest,
    QueryResponse,
    UploadResponse,
)
from app.services.dataset_service import (
    get_manifest,
    profile_dataset,
    update_manifest,
    upload_csv,
)
from app.services.query_service import execute_download, execute_playbook, execute_query

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

app = FastAPI(title="Chat-to-BI MVP", version="0.2.0")

# 初始化元数据表
init_metadata_tables()

# CORS — 开发阶段允许全部
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── 全局异常处理器 ────────────────────────────────
@app.exception_handler(DatasetNotFoundError)
async def dataset_not_found_handler(request: Request, exc: DatasetNotFoundError) -> JSONResponse:
    return JSONResponse(status_code=404, content={"detail": exc.message})


@app.exception_handler(SQLGuardrailError)
async def sql_guardrail_handler(request: Request, exc: SQLGuardrailError) -> JSONResponse:
    return JSONResponse(status_code=403, content={"detail": exc.message})


@app.exception_handler(FileValidationError)
async def file_validation_handler(request: Request, exc: FileValidationError) -> JSONResponse:
    return JSONResponse(status_code=400, content={"detail": exc.message})


# ── POST /datasets/upload ──────────────────────────────
@app.post("/datasets/upload", response_model=UploadResponse)
async def api_upload_dataset(file: UploadFile = File(...)) -> UploadResponse:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise FileValidationError("仅支持 CSV 文件")

    content = await file.read()

    # 检查文件大小
    if len(content) > settings.MAX_FILE_SIZE_BYTES:
        raise FileValidationError(f"文件大小超过限制 ({settings.MAX_FILE_SIZE_MB}MB)")

    return upload_csv(file.filename, content)


# ── GET /datasets/{dataset_id}/profile ─────────────────
@app.get(
    "/datasets/{dataset_id}/profile",
    response_model=ProfileResponse,
    responses={404: {"model": ErrorResponse}},
)
async def api_get_profile(dataset_id: str) -> ProfileResponse:
    return profile_dataset(dataset_id)


# ── GET /datasets/{dataset_id}/manifest ────────────────
@app.get("/datasets/{dataset_id}/manifest", response_model=ManifestResponse)
async def api_get_manifest(dataset_id: str) -> ManifestResponse:
    return get_manifest(dataset_id)


# ── PUT /datasets/{dataset_id}/manifest ────────────────
@app.put("/datasets/{dataset_id}/manifest", response_model=ManifestResponse)
async def api_update_manifest(dataset_id: str, body: ManifestUpdate) -> ManifestResponse:
    return update_manifest(dataset_id, body)


# ── POST /chat/query ───────────────────────────────────
@app.post("/chat/query", response_model=QueryResponse)
async def api_chat_query(req: QueryRequest) -> QueryResponse:
    return execute_query(req.dataset_id, req.question)


# ── POST /playbook ─────────────────────────────────────
@app.post("/playbook", response_model=QueryResponse)
async def api_playbook(req: PlaybookRequest) -> QueryResponse:
    return execute_playbook(req)


# ── GET /datasets/{dataset_id}/download ────────────────
@app.get("/datasets/{dataset_id}/download")
async def api_download_csv(dataset_id: str, sql: str = Query(...)) -> StreamingResponse:
    columns, raw_rows = execute_download(sql, dataset_id)

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(columns)
    for row in raw_rows:
        writer.writerow(row)
    buf.seek(0)

    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={dataset_id}_result.csv"},
    )
