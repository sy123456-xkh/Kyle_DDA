"""Chat-to-BI MVP — FastAPI 入口"""

import csv
import io
import logging

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

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

# CORS — 开发阶段允许全部
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── POST /datasets/upload ──────────────────────────────
@app.post("/datasets/upload", response_model=UploadResponse)
async def api_upload_dataset(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="仅支持 CSV 文件")

    try:
        content = await file.read()
        return upload_csv(file.filename, content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CSV 导入失败: {e}")


# ── GET /datasets/{dataset_id}/profile ─────────────────
@app.get(
    "/datasets/{dataset_id}/profile",
    response_model=ProfileResponse,
    responses={404: {"model": ErrorResponse}},
)
async def api_get_profile(dataset_id: str):
    try:
        return profile_dataset(dataset_id)
    except Exception as e:
        error_msg = str(e)
        if "does not exist" in error_msg or "not found" in error_msg.lower():
            raise HTTPException(status_code=404, detail=f"数据集 {dataset_id} 不存在")
        raise HTTPException(status_code=500, detail=f"Profiling 失败: {error_msg}")


# ── GET /datasets/{dataset_id}/manifest ────────────────
@app.get("/datasets/{dataset_id}/manifest", response_model=ManifestResponse)
async def api_get_manifest(dataset_id: str):
    try:
        return get_manifest(dataset_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ── PUT /datasets/{dataset_id}/manifest ────────────────
@app.put("/datasets/{dataset_id}/manifest", response_model=ManifestResponse)
async def api_update_manifest(dataset_id: str, body: ManifestUpdate):
    try:
        return update_manifest(dataset_id, body)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ── POST /chat/query ───────────────────────────────────
@app.post("/chat/query", response_model=QueryResponse)
async def api_chat_query(req: QueryRequest):
    try:
        return execute_query(req.dataset_id, req.question)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        error_msg = str(e)
        if "does not exist" in error_msg or "not found" in error_msg.lower():
            raise HTTPException(
                status_code=404, detail=f"数据集 {req.dataset_id} 不存在"
            )
        raise HTTPException(status_code=500, detail=f"查询失败: {error_msg}")


# ── POST /playbook ─────────────────────────────────────
@app.post("/playbook", response_model=QueryResponse)
async def api_playbook(req: PlaybookRequest):
    try:
        return execute_playbook(req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        error_msg = str(e)
        if "does not exist" in error_msg or "not found" in error_msg.lower():
            raise HTTPException(
                status_code=404, detail=f"数据集 {req.dataset_id} 不存在"
            )
        raise HTTPException(status_code=500, detail=f"Playbook 执行失败: {error_msg}")


# ── GET /datasets/{dataset_id}/download ────────────────
@app.get("/datasets/{dataset_id}/download")
async def api_download_csv(dataset_id: str, sql: str = Query(...)):
    try:
        columns, raw_rows = execute_download(sql, dataset_id)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"下载失败: {e}")

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
