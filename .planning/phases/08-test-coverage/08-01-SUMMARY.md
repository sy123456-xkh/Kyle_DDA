---
phase: 08-test-coverage
plan: 01
title: 后端测试（pytest）— 完成总结
status: done
completed_at: 2026-04-03
---

# Phase 08-01 Summary: 后端测试（pytest）

## 结果

| 指标 | 目标 | 实际 |
|------|------|------|
| 测试总数 | ≥ 11（计划中约定的最小用例数） | **49 个测试** |
| 全部通过 | ✅ | **49/49 PASSED** |
| 后端覆盖率 | ≥ 60% | **76%** |

---

## 新增文件

| 文件 | 说明 |
|------|------|
| `backend/tests/__init__.py` | 测试包标识（空文件） |
| `backend/tests/conftest.py` | 共享 fixtures：临时目录隔离、TestClient、样本 CSV、uploaded_dataset |
| `backend/tests/test_guardrails.py` | SQL 护栏单元测试（15 个用例） |
| `backend/tests/test_query.py` | /chat/query 集成测试（9 个用例） |
| `backend/tests/test_upload_profile.py` | 上传 + profiling 集成测试（25 个用例） |

## 修改文件

| 文件 | 改动原因 |
|------|----------|
| `backend/requirements.txt` | 新增 pytest==8.3.4、pytest-cov==6.0.0、httpx==0.28.1 |
| `backend/app/db.py` | 修复两个预存 Bug（见下方） |

---

## 发现并修复的 Bug

### Bug 1：`get_conn()` 不检测已关闭的连接
**症状**：`_execute_sql()` 在 `finally` 块中调用 `conn.close()`，但不清除 `_thread_local.connection`。后续 `get_conn()` 返回同一个已关闭的连接对象，导致 `execute_query()` 在写入 `query_history` 时抛出 `ConnectionException: Connection already closed!`。

**修复**：在 `get_conn()` 中增加健康检查（`SELECT 1`），若连接已关闭则自动重建。

**影响**：生产环境中 uvicorn 使用多线程（每个请求分配独立线程），所以这个 bug 在生产中不复现，但在单线程 TestClient 中会触发。

### Bug 2：`query_history.id` 无默认值导致 NOT NULL 约束失败
**症状**：`CREATE TABLE query_history (id INTEGER PRIMARY KEY, ...)` 在 DuckDB 中不会自动创建序列（不同于 SQLite 的 `ROWID` 机制）。`INSERT` 时不提供 `id` 值，触发 `ConstraintException: NOT NULL constraint failed`。

**修复**：改用 `CREATE SEQUENCE IF NOT EXISTS seq_query_history` + `DEFAULT nextval('seq_query_history')` 实现自增 ID。

---

## 测试隔离策略

`conftest.py` 通过 `autouse=True` 的 `tmp_data_dir` fixture 实现每个测试的完整隔离：

1. **DATA_DIR** — monkeypatch `settings.DATA_DIR` + `dataset_service.DATA_DIR` 到 pytest `tmp_path`（每个测试唯一目录）
2. **DB_PATH** — monkeypatch `settings.DB_PATH` + `db.DB_PATH` 到 `tmp_path/test.duckdb`
3. **DuckDB 连接** — 每次 fixture 执行时调用 `close_all_connections()` 清除线程本地连接，强制下一次 `get_conn()` 建立新连接到临时 DB
4. **Manifest 缓存** — monkeypatch `_manifests_cache = {}` 防止跨测试污染

---

## 覆盖率明细

```
Name                              Stmts   Miss  Cover
------------------------------------------------------
app/__init__.py                       0      0   100%
app/config.py                        11      0   100%
app/db.py                            33      4    88%
app/exceptions.py                    16      0   100%
app/main.py                          58     13    78%
app/schemas.py                       59      0   100%
app/services/__init__.py              0      0   100%
app/services/dataset_service.py     126     31    75%
app/services/query_service.py       110     53    52%
------------------------------------------------------
TOTAL                               413    101    76%
```

未覆盖的主要区域（`query_service.py` 52%）：
- `_guard_download_sql` / `execute_download`（下载 CSV 功能）
- `execute_playbook`（趋势/TopN/交叉分析 playbook）
- `get_query_history`（查询历史接口）

这些功能在 phase 08-02 中可进一步补充测试。

---

## 运行命令

```bash
cd backend
source .venv/bin/activate

# 运行全部测试
pytest

# 运行全部测试 + 覆盖率
pytest --cov=app --cov-report=term-missing

# 仅运行某个模块
pytest tests/test_guardrails.py -v
pytest tests/test_query.py -v
pytest tests/test_upload_profile.py -v
```

---

## Commits

1. `feat(08-01): add pytest infrastructure and conftest fixtures`
2. `feat(08-01): add SQL guardrail and query endpoint tests`
   （含 `db.py` Bug 修复）
3. `feat(08-01): add upload/profile tests, verify coverage ≥60%`
