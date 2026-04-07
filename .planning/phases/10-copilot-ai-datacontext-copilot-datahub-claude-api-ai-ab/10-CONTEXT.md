# Phase 10: Copilot 修复与 AI 接入 - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

修复 4 个已诊断问题并接入 AI：
1. DataContext 跨页面断层（data-hub 局部 Provider 冲突）
2. Copilot 导航与 DataHub 不对齐（自写 nav vs 共享组件）
3. 接入 AI 分析（可配置 LLM 提供商，支持 Claude/DeepSeek 等）
4. 激活所有伪按钮

不新增页面，不引入 LangGraph 依赖（仅预留接口骨架）。

</domain>

<decisions>
## Implementation Decisions

### DataContext 修复
- **D-01:** 删除 `frontend/app/data-hub/page.tsx` 底部的局部 `<DataProvider>` 包裹，直接使用 `layout.tsx` 中的全局 Provider
- **D-02:** `layout.tsx` 已有全局 `<DataProvider>`，无需修改

### 导航结构统一
- **D-03:** 将 `<Navigation>` 组件移入 `layout.tsx`，data-hub 和 copilot 共享同一个 header，切换页面时 header 不动（丝滑切换效果）
- **D-04:** 两个页面各自的 `<Navigation>` 引用删除，改由 layout 统一渲染
- **D-05:** `copilot/page.tsx` 顶部自写的 nav（"Kyle Studios BI Copilot" + Workspace/Insights/Datasets/Reports）完全替换

### AI 端点设计
- **D-06:** 新增 `POST /ai/insight` 端点，返回 `{ insight, suggestions, ab_test }`
- **D-07:** LLM 调用设计为可配置提供商：从环境变量读取 `LLM_BASE_URL`、`LLM_API_KEY`、`LLM_MODEL`，兼容 OpenAI 兼容接口（Claude/DeepSeek/其他）
- **D-08:** 无 API Key 时：模拟 AI 对话（返回规则生成的简单洞察），不阻断流程，但错误场景（如未上传 CSV）仍要提示
- **D-09:** 发送给 LLM 的 context：schema（字段名+类型）+ 前 20 行样本数据 + 用户问题 + chart spec
- **D-10:** 模型名从环境变量 `LLM_MODEL` 读取，不写死
- **D-11:** 新建 `backend/app/services/ai_service.py`，封装 LLM 调用逻辑
- **D-12:** 预留 `backend/app/graph/agent.py` 骨架（空函数 `run_agent(state: dict) -> dict`），不引入 LangGraph 依赖

### AI 内容展示
- **D-13:** 聊天气泡显示完整 AI 回复内容（insight + suggestions + ab_test 格式化展示）
- **D-14:** 右侧 Business Insights 面板同步更新，展示最新一次查询的洞察条目（3-5 条）
- **D-15:** 每次新查询完成后，右侧面板内容替换为最新洞察（不累积历史）

### 伪按钮激活
- **D-16:** **Export CSV** — 前端直接将当前查询结果 rows 转为 CSV 并触发浏览器下载，无需后端
- **D-17:** **Share Report** — 复制当前页面 URL 到剪贴板，显示 Toast 提示"链接已复制"
- **D-18:** **New Analysis** — 清空聊天记录，保留当前 dataset（不跳转页面）
- **D-19:** **Help & Feedback** — 点击显示 Toast 占位符"功能建设中，敬请期待"
- **D-20:** **生成深度分析报告** — 调用 `/ai/insight`，结果在弹窗（Modal）中展示完整报告
- **D-21:** 全屏按钮、更多按钮（右侧图表区）— Toast 占位符

### 页面结构
- **D-22:** 保持 `/data-hub` 和 `/copilot` 分离路由，不合并为单页
- **D-23:** Navigation 移入 `layout.tsx`，实现 header 固定、内容区切换的丝滑效果

### Claude's Discretion
- AI 回复的具体 prompt 模板设计（参考用户提供的模板骨架）
- LangGraph agent.py 骨架的具体函数签名
- Export CSV 的文件命名规则
- Modal 弹窗的具体样式

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 核心文件
- `frontend/app/contexts/DataContext.tsx` — 全局 DataProvider，正确的那个
- `frontend/app/data-hub/page.tsx` — 局部 DataProvider 在此（需删除第 58-63 行包裹）
- `frontend/app/copilot/page.tsx` — 整个文件需重构导航 + AI 接入
- `frontend/app/components/Navigation.tsx` — 共享导航组件，copilot 应使用此
- `frontend/app/layout.tsx` — 全局 DataProvider + ToastProvider，Navigation 将移入此处

### 后端
- `backend/app/services/query_service.py` — 现有查询服务，AI 服务参考此结构
- `backend/app/schemas.py` — Pydantic 模型，新增 AIInsightRequest/Response
- `backend/app/main.py` — 路由注册，新增 /ai/insight
- `backend/.env.example` — 已有 ANTHROPIC_API_KEY 注释，需扩展为通用 LLM 配置

### 需求参考
- `CLAUDE.md` — 项目原始约束（REQ-FUNC-007, REQ-FUNC-008 LLM 集成需求）
- `.planning/REQUIREMENTS.md` §4.4 — LLM 集成需求（REQ-FUNC-007/008）

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DataContext.tsx` — 已有 `useData()` hook，copilot 页面已正确调用，只需修复 data-hub 的局部 Provider
- `Navigation.tsx` — 已有 `activePage` prop 和 `hasDataset` prop，直接复用
- `Toast` 系统 — `useToast()` hook 已全局可用，伪按钮 Toast 占位符直接调用
- `api.ts` (lib/api) — 统一 API 客户端，新增 `aiInsight()` 方法
- ECharts 集成 — workspace 页面已有完整图表渲染，copilot 右侧面板可复用

### Established Patterns
- 状态管理：React Context + useState（不引入新库）
- API 调用：`lib/api.ts` 统一封装，fetch + 自定义错误处理
- 错误提示：Toast 系统（show(msg, "error")）
- 后端服务层：`services/` 目录，参考 `query_service.py` 结构

### Integration Points
- `layout.tsx` — Navigation 将在此渲染，需确保 `activePage` 能从路由动态获取（usePathname）
- `backend/app/main.py` — 新增 `/ai/insight` 路由，参考现有 `/chat/query` 注册方式
- `backend/requirements.txt` — 需新增 `openai`（用于 OpenAI 兼容接口调用）或 `anthropic`

</code_context>

<specifics>
## Specific Ideas

### 用户提供的 AI Prompt 模板骨架
```
你是电商数据分析专家。

数据摘要：{rows[:20]}
图表结构：{chart}
指标定义：{manifest}
问题：{question}

请输出：
1. 核心结论（1-2条）
2. 异常点
3. 业务解释
4. 可执行优化建议（2条）
5. 一个A/B测试方案（目标/分组/指标/周期）
```

### 后端 AI 端点 Request/Response 结构
```json
// POST /ai/insight
// Request:
{
  "dataset_id": "ds_xxx",
  "question": "用户问题",
  "chart": {...},
  "rows": [...],
  "manifest": {...}
}

// Response:
{
  "insight": "文本分析",
  "suggestions": ["建议1", "建议2"],
  "ab_test": {
    "goal": "...",
    "metric": "...",
    "design": "...",
    "duration": "..."
  }
}
```

### 环境变量设计（通用 LLM 配置）
```
LLM_BASE_URL=https://api.anthropic.com  # 或 DeepSeek 等
LLM_API_KEY=sk-xxx
LLM_MODEL=claude-3-5-haiku-20241022     # 或 deepseek-chat 等
```

### 页面切换丝滑效果
Navigation 移入 layout.tsx 后，使用 `usePathname()` 动态设置 `activePage`，header 在路由切换时保持位置不变。

</specifics>

<deferred>
## Deferred Ideas

- **LangGraph 完整集成** — 本次仅预留 `agent.py` 骨架，不引入依赖，未来 M2 实现
- **多会话支持** — New Analysis 目前只清空聊天，多 Tab 会话属于新功能
- **图表导出/下载** — Phase 6 已决定不做，本次不引入
- **Playbook 按钮 UI** — 用户提到 trend/topn/cross 按钮，但 Phase 10 范围是修复+AI接入，Playbook 按钮 UI 如需新增应在规划时确认是否在范围内

</deferred>

---

*Phase: 10-copilot-ai-datacontext-copilot-datahub-claude-api-ai-ab*
*Context gathered: 2026-04-07*
