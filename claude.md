# 项目：Chat-to-BI 毕业项目 MVP（分阶段交付）

你是资深全栈/IT架构工程师。请在本仓库内实现一个可运行的 MVP：单页面 Chat-to-BI 控制台。
目标是面试展示：上传CSV→字段解析(profile/manifest)→自然语言提问→（后续接Claude）生成SQL(护栏)→DuckDB执行→返回结果/图表spec/洞察。

## 固定约束（切换模型也必须遵守）
- 需求唯一来源：CLAUDE.md
- 每次开始先读取当前仓库结构与已有代码，再增量修改
- 严格分阶段：一次只做一个 Step
- 所有接口契约与目录结构不得随意变更

请使用 GitHub MCP：
1) 在我的 GitHub 账号下创建一个新的 repository，名称为 chat-to-bi-mvp（public 或 private 都可以，默认 private）。
2) 将当前本地项目作为初始提交推送到该 repo 的 main 分支：
   - 如果 main 不存在请创建
   - 设置 origin remote
   - push 当前提交
3) 返回：仓库地址、main 分支最新 commit hash。
## 总体约束
- 所有说明/README尽量中文
- 后端：Python 3.11 + FastAPI
- 前端：Next.js + TypeScript
- 分析引擎：DuckDB（本地文件 backend/data/app.duckdb）
- 不做企业级审计/多租户计费，但要有：SQL护栏、最小错误处理、最小可观测（后续）
- 我使用 macOS，本地开发运行即可

## 分阶段交付（必须严格按顺序）
你一次只做一个阶段：先输出该阶段的代码与运行方式，我运行验证后再让你继续下一个阶段。
每个阶段输出包含：
1) 需要创建/修改的文件列表
2) 每个文件的完整内容
3) 如何运行与验证（命令 + curl 示例）
4) 常见错误排查（简短）

---

# Step1：只做后端骨架（不要前端、不要LLM）
目录结构固定：
- backend/
  - app/main.py
  - app/db.py
  - app/schemas.py
  - app/services/
  - data/            # 保存CSV与app.duckdb
  - requirements.txt
  - .env.example
  - README.md

必须实现：
1) POST /datasets/upload
   - 接收 CSV multipart file
   - 生成 dataset_id（短id，确保可用作表名：仅字母数字下划线）
   - 保存到 backend/data/{dataset_id}.csv
   - DuckDB：CREATE TABLE dataset_{id} AS SELECT * FROM read_csv_auto(...)
   - DuckDB：CREATE VIEW v_dataset_{id} AS SELECT * FROM dataset_{id}
   - 返回 {dataset_id}

2) GET /datasets/{id}/profile
   - 用 DuckDB SQL 完成 profiling（不使用 pandas）并返回：
     - row_count
     - columns: [{name,type}]
     - missing_rate: [{name,missing_rate}]  (0~1)
     - sample_values: [{name,values:[...]}] （前5个非空）
   - 失败时返回可读错误 JSON

补充要求：
- CORS 允许全部（开发阶段）
- 连接管理：每次请求复用同一个 duckdb 文件 backend/data/app.duckdb
- 注意 CSV 解析失败/找不到 dataset_id 的错误处理
- README 写清楚如何启动：cd backend && python -m venv .venv && pip install -r requirements.txt && uvicorn app.main:app --reload

---

# Step2：增加 /chat/query（暂时不用LLM）
新增 POST /chat/query
入参：{ "dataset_id": "...", "question": "..." }
逻辑先用规则：
- question 包含 “行数|count|多少行” -> SELECT COUNT(*) AS row_count FROM v_dataset_{id}
- 否则 -> SELECT * FROM v_dataset_{id} LIMIT 50
加入 SQL Guardrails：
- 仅允许 SELECT；若包含 INSERT/UPDATE/DELETE/DROP/ALTER 等直接拒绝
- 自动补 LIMIT 5000（已有 LIMIT 则不改）
返回：
{ "sql": "...", "rows": [...], "meta": {"elapsed_ms":..,"row_count":..} }

---

# Step3：实现前端（Next.js 单页）
目录结构：
- frontend/
  - app/  (Next.js App Router)
  - .env.example (NEXT_PUBLIC_API_BASE)
  - README.md

页面三栏：
- 左：上传CSV、显示dataset_id、调用 /profile 展示字段表（列名/类型/缺失率/样例值）
- 中：聊天输入 + 历史
- 右：展示 rows（表格即可）+ SQL + meta（耗时、行数）+ 复制SQL按钮

注意：先不做图表与LLM，先能跑通上传→profile→query→表格展示。



## 模型切换后必须执行
- 第一步：读取 CLAUDE.md 与当前 repo tree
- 只允许“增量修改”，禁止重构目录/重命名接口
- 每次输出必须包含：文件清单 + 完整文件内容 + 运行命令 + curl 验证
- 若需要新增依赖，必须解释原因并写入 requirements.txt

---

现在请从 Step1 开始，输出完整代码与运行验证方式。