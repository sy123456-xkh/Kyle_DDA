# Chat-to-BI MVP — 后端

## 技术栈

| 组件 | 版本 |
|------|------|
| Python | 3.11 |
| FastAPI | 0.115.6 |
| DuckDB | 1.1.3 |
| Pydantic | 2.10.4 |
| Uvicorn | 0.34.0 |

---

## 快速启动

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- 服务地址：`http://127.0.0.1:8000`
- **Swagger UI（交互式 API 文档）：`http://127.0.0.1:8000/docs`**
- ReDoc：`http://127.0.0.1:8000/redoc`

---

## API 端点

### `POST /datasets/upload`

上传 CSV 文件，自动在 DuckDB 中建表和视图。

**请求：** `multipart/form-data`，字段名 `file`，仅接受 `.csv`

```bash
curl -X POST http://127.0.0.1:8000/datasets/upload \
  -F "file=@data/sample.csv"
```

**响应：**
```json
{ "dataset_id": "ds_a1b2c3d4" }
```

---

### `GET /datasets/{dataset_id}/profile`

获取数据集字段信息和统计（全部通过 DuckDB SQL 计算，无 pandas）。

```bash
curl http://127.0.0.1:8000/datasets/ds_a1b2c3d4/profile
```

**响应：**
```json
{
  "row_count": 100,
  "columns": [{"name": "date", "type": "DATE"}, {"name": "revenue", "type": "DOUBLE"}],
  "missing_rate": [{"name": "date", "missing_rate": 0.0}, {"name": "revenue", "missing_rate": 0.05}],
  "sample_values": [{"name": "date", "values": ["2024-01-01", "2024-01-02"]}]
}
```

---

### `GET /datasets/{dataset_id}/manifest`

获取数据集语义配置（时间列、指标列、聚合方式、时间粒度）。

### `PUT /datasets/{dataset_id}/manifest`

更新语义配置。

```bash
curl -X PUT http://127.0.0.1:8000/datasets/ds_a1b2c3d4/manifest \
  -H "Content-Type: application/json" \
  -d '{"primary_time_col": "date", "metric_col": "revenue", "metric_agg": "sum", "time_grain": "month"}'
```

---

### `POST /chat/query`

自然语言 → SQL → DuckDB 执行。

```bash
curl -X POST http://127.0.0.1:8000/chat/query \
  -H "Content-Type: application/json" \
  -d '{"dataset_id": "ds_a1b2c3d4", "question": "总共有多少行？"}'
```

**规则引擎：**
- 含「行数 / count / 多少行」→ `SELECT COUNT(*)`
- 其他 → `SELECT * FROM v_dataset_{id} LIMIT 50`

---

### `POST /playbook`

预设分析模板，自动生成图表 spec。

| playbook | 说明 | 必填字段 | 图表 |
|----------|------|----------|------|
| `trend` | 时间趋势聚合 | time_col, metric_col | line |
| `topn` | Top N 维度排行 | dim_col, metric_col | bar |
| `cross` | 维度分布占比 | dim_col, metric_col | pie |

```bash
curl -X POST http://127.0.0.1:8000/playbook \
  -H "Content-Type: application/json" \
  -d '{"dataset_id": "ds_a1b2c3d4", "playbook": "topn", "dim_col": "product", "metric_col": "revenue"}'
```

---

### `GET /datasets/{dataset_id}/download`

以 CSV 格式流式下载查询结果（最多 50000 行）。

```bash
curl "http://127.0.0.1:8000/datasets/ds_a1b2c3d4/download?sql=SELECT+*+FROM+v_dataset_ds_a1b2c3d4+LIMIT+100" \
  -o result.csv
```

---

## SQL 护栏

| 规则 | 说明 |
|------|------|
| 仅 SELECT | INSERT/UPDATE/DELETE/DROP/ALTER 等直接拒绝（HTTP 400） |
| 自动补 LIMIT | 无 LIMIT 时自动追加 `LIMIT 5000` |
| 长度限制 | SQL > 5000 字符被拒绝 |
| 下载专用 | 额外校验视图名，LIMIT ≤ 50000 |

---

## 运行测试

```bash
source .venv/bin/activate

pytest -v                                    # 全部测试（49个）
pytest --cov=app --cov-report=term-missing  # 带覆盖率（当前 76%）
pytest tests/test_guardrails.py -v          # 仅护栏测试
```

---

## 代码质量命令

```bash
python -m black app/          # 格式化
python -m ruff check app/     # lint 检查
python -m mypy app/           # 类型检查
```

---

## 常见问题排查

**端口 8000 被占用**
```bash
lsof -i :8000 && kill -9 <PID>
```

**DuckDB 文件锁（`IO Error: Could not set lock`）**
- 关闭所有连接该文件的程序（DBeaver 等）
- 必要时删除 `data/app.duckdb` 重新启动（数据丢失）

**CSV 中文乱码（GBK 编码）**
```bash
iconv -f GBK -t UTF-8 input.csv > output.csv
```

**上传返回 `422 Unprocessable Entity`**
- 字段名必须是 `file`（不是 `csv` 或其他）
- Content-Type 必须是 `multipart/form-data`

**mypy 类型检查失败**
- 确认 Python ≥ 3.11：`python --version`
- 在 venv 中运行：`source .venv/bin/activate && python -m mypy app/`
