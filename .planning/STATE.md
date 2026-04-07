---
project: Chat-to-BI MVP 全面重构
milestone: M1 - 重构与功能完善
current_phase: 10
status: completed
last_updated: 2026-04-07
---

# 项目状态

## 当前进度

**里程碑：** M1 - 重构与功能完善
**状态：** ✅ **全部完成**
**总进度：** 10/10 阶段已完成 (100%)

## 已完成阶段

### Phase 1-9: 全部完成 ✅
- 后端架构重构、安全加固、数据库优化
- 前端架构重构、UX 优化、数据可视化
- 代码质量、测试覆盖、文档完善

### Phase 10: Copilot 修复与 AI 接入 ✅

#### Plan 10-01: DataContext 跨页面修复 + 全局 Navigation ✅
- 删除 data-hub/page.tsx 局部 DataProvider
- 新增 ClientLayout 组件（usePathname + useData）
- layout.tsx 全局 Navigation
- Commits: b4d019d, fa064f0, cb0f91c

#### Plan 10-02: 后端 AI 洞察端点 ✅
- config.py 新增 llm_base_url/llm_api_key/llm_model
- requirements.txt 追加 openai>=1.0.0
- schemas.py 新增 AIInsightRequest/ABTestSpec/AIInsightResponse
- ai_service.py：generate_insight + mock fallback + LLM 调用
- graph/agent.py：run_agent 骨架（无 langgraph 依赖）
- main.py 注册 POST /ai/insight
- Commits: c581208, b78c86d, 864d2e6, e811949

#### Plan 10-03: 前端 Copilot AI 接入 + 死按钮修复 ✅
- api.ts 新增 AIInsightResponse 接口 + aiInsight 方法
- copilot/page.tsx 删除自写 nav，接入 /ai/insight
- handleSend 重写：/chat/query 获取数据行 + /ai/insight 生成洞察
- 激活所有按钮：Export CSV、Share Report、New Analysis、Help、Feedback、全屏、更多、生成深度分析报告
- Business Insights 面板改为动态 AI suggestions
- 深度分析报告 Modal 实现
- TypeScript 编译无错误
- Commits: 6b32f50, 410d792

## 决策记录

### 2026-04-07: Phase 10 AI 接入
- **LLM 提供商：** OpenAI-compatible（支持 DeepSeek/Claude 等，base_url 可配置）
- **降级策略：** 无 API Key 时返回规则 mock，不阻断流程
- **Agent 架构：** graph/agent.py 预留 LangGraph 骨架，M2 阶段替换
- **前端集成：** handleSend 先调 /chat/query 获取数据行，再调 /ai/insight 生成洞察

### 2026-04-07: Phase 8 测试覆盖
- **后端:** pytest + httpx TestClient，临时目录隔离 DuckDB
- **前端:** Vitest + @testing-library/react，jsdom 环境
- **覆盖目标:** 后端 ≥60% → 实际 76%，前端 ≥50% → 实际 52%

## 下一步

**M1 里程碑已完成。** 可考虑：
- 启动 M2：LLM 集成深化（LangGraph 工作流、SQL 生成）
- 配置真实 LLM API Key（DeepSeek/Claude）验证 AI 功能
- 准备面试演示材料
- 部署到线上环境
