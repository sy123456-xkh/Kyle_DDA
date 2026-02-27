# Chat-to-BI MVP — 后端

## 技术栈
- Python 3.11 + FastAPI
- DuckDB（本地文件 `data/app.duckdb`）

## 快速启动

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

服务默认运行在 `http://127.0.0.1:8000`。

## API 端点（Step1）

### POST /datasets/upload
上传 CSV 文件，自动建表 + 视图。

```bash
curl -X POST http://127.0.0.1:8000/datasets/upload \
  -F "file=@sample.csv"
```

返回示例：
```json
{"dataset_id": "ds_a1b2c3d4"}
```

### GET /datasets/{dataset_id}/profile
获取数据集 profiling 信息。

```bash
curl http://127.0.0.1:8000/datasets/ds_a1b2c3d4/profile
```

返回示例：
```json
{
  "row_count": 100,
  "columns": [{"name": "id", "type": "BIGINT"}, ...],
  "missing_rate": [{"name": "id", "missing_rate": 0.0}, ...],
  "sample_values": [{"name": "id", "values": [1, 2, 3, 4, 5]}, ...]
}
```

## 常见问题
- **端口被占用**：`lsof -i :8000` 查看并 kill 占用进程
- **duckdb 文件锁**：确保没有其他进程（如 DBeaver）正在连接同一个 `app.duckdb`
- **CSV 编码问题**：DuckDB `read_csv_auto` 默认支持 UTF-8，若为 GBK 可能需手动转码
