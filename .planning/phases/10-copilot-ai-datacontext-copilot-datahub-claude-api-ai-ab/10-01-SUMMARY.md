---
phase: 10-copilot-ai-datacontext-copilot-datahub-claude-api-ai-ab
plan: 01
status: completed
completed: 2026-04-07
commits:
  - b4d019d — fix(10-01): remove local DataProvider from data-hub/page.tsx
  - fa064f0 — feat(10-01): add ClientLayout — global NavWrapper with usePathname + useData
  - cb0f91c — fix(10-01): remove Navigation from DataHubContent — layout provides it globally
---

# Plan 10-01 Summary: DataContext 跨页面修复 + 全局 Navigation

## 目标

修复 DataContext 跨页面断层：data-hub/page.tsx 的局部 DataProvider 与 layout.tsx 的全局 DataProvider 是两个独立实例，导致上传的数据集在 copilot 页面不可见。同时将 Navigation 移入 layout.tsx 实现全局共享 header。

## 完成的任务

### Task 1: 删除 data-hub/page.tsx 的局部 DataProvider 包裹
- 移除 `import { DataProvider }` 导入
- `DataHubPage` 从 `<DataProvider><DataHubContent /></DataProvider>` 改为直接 `return <DataHubContent />`
- 现在依赖 layout.tsx 的全局 DataProvider

### Task 2: 新增 ClientLayout 组件 + 更新 layout.tsx
- 新建 `frontend/app/components/ClientLayout.tsx`（Client Component）
- 使用 `usePathname()` 动态计算 `activePage`
- 使用 `useData()` 获取 `datasetId` 传给 `hasDataset` prop
- `layout.tsx` 引入 `ClientLayout`，包裹 `{children}`，仍为 Server Component

### Task 3: 删除 DataHubContent 中的 Navigation 渲染
- 移除 `import Navigation` 导入
- 删除 `<Navigation activePage="data-hub" hasDataset={!!datasetId} />` JSX 行
- Navigation 现由 layout.tsx 的 ClientLayout 统一提供

## 验收结果

- `grep "DataProvider" frontend/app/data-hub/page.tsx` → 无匹配 ✅
- `grep "Navigation" frontend/app/data-hub/page.tsx` → 无匹配 ✅
- `frontend/app/components/ClientLayout.tsx` 存在，含 `"use client"`、`usePathname`、`useData` ✅
- `layout.tsx` 引入 ClientLayout，无 `"use client"` 指令（Server Component）✅
- activePage 路由逻辑：`/copilot` → copilot，`/data-hub` → data-hub，其余 → landing ✅

## 影响

上传 CSV 后切换到 /copilot，左侧 datasetId 和字段列表现在可见（DataContext 跨页面共享）。header 在页面切换时不重新挂载，activePage 高亮随路由自动切换。
