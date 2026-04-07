---
phase: 10-copilot-ai-datacontext-copilot-datahub-claude-api-ai-ab
plan: 03
status: completed
completed: 2026-04-07
commits:
  - 6b32f50 — feat(10-03): add AIInsightResponse interface and aiInsight method to api.ts
  - 410d792 — feat(10-03): refactor copilot/page.tsx — remove nav, integrate AI, activate all buttons
---

# Plan 10-03 Summary: 前端 AI 集成 + Copilot 页面重构

## 目标

重构 copilot/page.tsx：删除自写 nav，接入 /ai/insight 端点，激活所有伪按钮，Business Insights 改为动态 AI 内容。

## 完成的任务

### Task 1: 在 api.ts 中新增 aiInsight 方法
- `frontend/lib/api.ts` 新增三个 TypeScript 接口：`AIInsightRequest`、`ABTestSpec`、`AIInsightResponse`（export）
- `ApiClient` 类新增 `aiInsight(req)` 方法，POST /ai/insight，含错误处理
- 原有 `uploadDataset` 和 `getProfile` 方法未改动

### Task 2: 重构 copilot/page.tsx
- 删除整个 `<nav>` 块（"Kyle Studios BI Copilot" 自写导航），改由 layout.tsx ClientLayout 统一提供
- 删除 `const API = process.env...` 行，改用 `api.ts` 统一调用
- 新增 import：`api`、`AIInsightResponse`（from api.ts）、`useToast`（from Toast.tsx）
- 新增 state：`insights`、`lastRows`、`showReportModal`、`reportData`
- 重写 `handleSend`：先调 /chat/query 获取数据行，再调 /ai/insight 生成洞察，格式化 insight + suggestions + ab_test 显示在聊天气泡
- 新增 `exportCSV`：将 lastRows 转 CSV 并触发浏览器下载
- 新增 `shareReport`：复制当前 URL 到剪贴板 + Toast
- 新增 `newAnalysis`：清空 messages/insights/lastRows
- 新增 `generateReport`：调用 /ai/insight 并在 Modal 中展示完整报告
- 消息气泡 action 按钮激活（Export CSV / Share Report）
- 左侧底部 New Analysis / Help / Feedback 按钮激活
- 右侧 Business Insights 改为动态 `insights` state（替换，不累积）
- 右侧全屏/更多按钮激活（Toast 占位符）
- 右侧 Active Model 显示 `NEXT_PUBLIC_LLM_MODEL` 或 "AI Copilot"
- 深度分析报告 Modal 实现（含 insight / suggestions / ab_test 展示）
- TypeScript 编译无错误（`npx tsc --noEmit` 无输出）

## 验收结果

- `grep "<nav" frontend/app/copilot/page.tsx` → 无匹配 ✅
- `grep "Kyle Studios BI Copilot" frontend/app/copilot/page.tsx` → 无匹配 ✅
- `grep "import.*Navigation" frontend/app/copilot/page.tsx` → 无匹配 ✅
- `grep "aiInsight" frontend/app/copilot/page.tsx` → 2 处（handleSend + generateReport）✅
- `grep "exportCSV\|shareReport\|newAnalysis\|generateReport" frontend/app/copilot/page.tsx` → 4 个函数定义 ✅
- `grep "showReportModal" frontend/app/copilot/page.tsx` → state 定义 + JSX 使用 ✅
- `grep "setInsights" frontend/app/copilot/page.tsx` → handleSend + newAnalysis ✅
- `grep "useToast" frontend/app/copilot/page.tsx` → 有匹配 ✅
- `grep "aiInsight\|AIInsightResponse" frontend/lib/api.ts` → 有匹配 ✅
- TypeScript 编译无错误 ✅

## 影响

- Phase 10 全部三个 Plan 完成，Copilot 页面完整接入 AI 后端
- 无 API Key 时，/ai/insight 返回 mock 洞察（规则生成），前端正常显示
- 有效 API Key 时，返回真实 LLM 分析结果
- 所有按钮均有 onClick handler，无空按钮
