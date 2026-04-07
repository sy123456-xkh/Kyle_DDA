---
phase: 10-copilot-ai-datacontext-copilot-datahub-claude-api-ai-ab
plan: 02
status: completed
completed: 2026-04-07
commits:
  - c581208 — feat(10-02): extend config with LLM fields, add openai dep, update .env.example
  - b78c86d — feat(10-02): add AIInsightRequest, ABTestSpec, AIInsightResponse to schemas
  - 864d2e6 — feat(10-02): add ai_service.py with LLM+mock fallback, add graph/agent.py skeleton
  - e811949 — feat(10-02): register POST /ai/insight route in main.py
---

# Plan 10-02 Summary: 后端 AI 洞察端点

## 目标

新增后端 POST /ai/insight 端点，封装 OpenAI-compatible LLM 调用，无 API Key 时返回 mock 洞察，不阻断流程。

## 完成的任务

### Task 1: 扩展 config.py + requirements.txt + .env.example
- `backend/app/config.py` 新增三个 LLM 字段：`llm_base_url`、`llm_api_key`、`llm_model`
- `backend/requirements.txt` 追加 `openai>=1.0.0`
- `backend/.env.example` 更新为完整 LLM 配置说明，含 DeepSeek 和 Claude 示例

### Task 2: 新增 AI Pydantic 模型到 schemas.py
- `AIInsightRequest`：dataset_id、question、可选 chart spec、rows 样本、manifest
- `ABTestSpec`：goal、metric、design、duration
- `AIInsightResponse`：insight、suggestions（list）、ab_test（可选）

### Task 3: 新建 ai_service.py 和 graph/agent.py
- `backend/app/services/ai_service.py`：
  - `generate_insight(req)` — 主入口，无 key 时自动降级
  - `_mock_insight(req)` — 规则生成洞察，含 3 条建议和 A/B 测试方案
  - `_call_llm(req)` — OpenAI SDK 调用，支持任意 OpenAI-compatible 提供商
  - `_build_prompt(req)` — 构建结构化 prompt，含 schema/sample/chart/manifest
- `backend/app/graph/__init__.py` — 空文件，使 graph 成为 Python 包
- `backend/app/graph/agent.py` — `run_agent(state: dict) -> dict` 骨架，无 langgraph 依赖

### Task 4: 注册 POST /ai/insight 路由
- `backend/app/main.py` 新增 `AIInsightRequest`、`AIInsightResponse` import
- 新增 `from app.services.ai_service import generate_insight`
- 注册 `POST /ai/insight` 路由，调用 `generate_insight`

## 验收结果

- `grep "llm_api_key" backend/app/config.py` → 有匹配 ✅
- `grep "openai" backend/requirements.txt` → `openai>=1.0.0` ✅
- `grep "class AIInsightRequest" backend/app/schemas.py` → 有匹配 ✅
- `grep "def generate_insight" backend/app/services/ai_service.py` → 有匹配 ✅
- `grep "def run_agent" backend/app/graph/agent.py` → 有匹配 ✅
- `grep "langgraph" backend/app/graph/agent.py` → 无匹配 ✅
- `grep "ai/insight" backend/app/main.py` → 有匹配 ✅

## 影响

- 无 LLM_API_KEY 时，POST /ai/insight 返回规则生成的 mock 洞察（3 条建议 + A/B 方案），不报错
- 有效 API Key 时，调用 OpenAI-compatible API（DeepSeek/Claude 等），返回真实 AI 分析
- graph/agent.py 为 M2 阶段 LangGraph 工作流预留接口
