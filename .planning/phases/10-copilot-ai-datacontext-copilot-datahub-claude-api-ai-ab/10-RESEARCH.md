# Phase 10: Research — Copilot 修复与 AI 接入

## RESEARCH COMPLETE

---

## 1. DataContext 跨页面断层修复

### 根因确认
`frontend/app/data-hub/page.tsx` 第 58-63 行：
```tsx
export default function DataHubPage() {
  return (
    <DataProvider>       // ← 局部 Provider，与 layout.tsx 全局 Provider 独立
      <DataHubContent />
    </DataProvider>
  )
}
```
`layout.tsx` 已有全局 `<DataProvider>`，两个实例互不共享状态。

### 修复方式
删除 `DataHubPage` 的包裹，直接 export `DataHubContent`：
```tsx
export default function DataHubPage() {
  return <DataHubContent />
}
```
无需修改 `DataContext.tsx` 或 `layout.tsx`。

---

## 2. Navigation 移入 layout.tsx

### 当前状态
- `data-hub/page.tsx` 在 `DataHubContent` 内渲染 `<Navigation activePage="data-hub" />`
- `copilot/page.tsx` 完全自写了一套 nav（不使用共享组件）

### 移入 layout.tsx 的实现方式
Next.js App Router 中，`layout.tsx` 在路由切换时不会重新挂载，天然实现 header 固定。

需要在 layout 层动态设置 `activePage`，使用 `usePathname()`：
```tsx
// layout.tsx — 需要 "use client" 或抽取 NavWrapper 组件
"use client"
import { usePathname } from "next/navigation"
import Navigation from "./components/Navigation"

function NavWrapper() {
  const pathname = usePathname()
  const activePage = pathname.startsWith("/copilot") ? "copilot"
    : pathname.startsWith("/data-hub") ? "data-hub"
    : "landing"
  return <Navigation activePage={activePage} hasDataset={...} />
}
```

**注意：** `layout.tsx` 本身是 Server Component，不能直接用 `usePathname`。需要抽取一个 `"use client"` 的 `NavWrapper` 组件，在 layout 中引入。

`hasDataset` 需要从 DataContext 读取，所以 `NavWrapper` 也需要 `useData()`。

### 各页面改动
- `data-hub/page.tsx`：删除 `<Navigation>` 引用
- `copilot/page.tsx`：删除整个自写 nav（`<nav>` 块）

---

## 3. 后端 AI 端点设计

### OpenAI-compatible 接口
使用 `openai` Python SDK（支持 `base_url` 参数），可对接任意兼容厂商：

```python
from openai import OpenAI

client = OpenAI(
    api_key=settings.llm_api_key,
    base_url=settings.llm_base_url,  # e.g. https://api.anthropic.com/v1 or https://api.deepseek.com
)

response = client.chat.completions.create(
    model=settings.llm_model,
    messages=[{"role": "user", "content": prompt}],
    max_tokens=1024,
)
```

**注意：** Anthropic 的 OpenAI 兼容端点是 `https://api.anthropic.com/v1`，需要额外 header `anthropic-version`。DeepSeek 直接兼容。建议默认用 DeepSeek 或通用配置。

### 环境变量扩展（backend/.env.example）
```
LLM_BASE_URL=https://api.deepseek.com
LLM_API_KEY=sk-xxx
LLM_MODEL=deepseek-chat
```

### 新增 Pydantic 模型（schemas.py）
```python
class AIInsightRequest(BaseModel):
    dataset_id: str
    question: str
    chart: ChartSpec | None = None
    rows: list[dict] = []
    manifest: dict = {}

class ABTestSpec(BaseModel):
    goal: str
    metric: str
    design: str
    duration: str

class AIInsightResponse(BaseModel):
    insight: str
    suggestions: list[str]
    ab_test: ABTestSpec | None = None
```

### ai_service.py 结构
```python
# backend/app/services/ai_service.py

def generate_insight(req: AIInsightRequest) -> AIInsightResponse:
    if not settings.llm_api_key:
        return _mock_insight(req)  # 无 API Key 时模拟
    return _call_llm(req)

def _mock_insight(req: AIInsightRequest) -> AIInsightResponse:
    """无 API Key 时返回基于规则的简单洞察"""
    ...

def _call_llm(req: AIInsightRequest) -> AIInsightResponse:
    """调用 OpenAI-compatible API"""
    ...
```

### Prompt 模板
```
你是电商数据分析专家。

数据字段：{schema}
样本数据（前20行）：{rows[:20]}
图表结构：{chart}
用户问题：{question}

请输出 JSON 格式：
{
  "insight": "核心结论（1-2条）",
  "suggestions": ["可执行建议1", "可执行建议2"],
  "ab_test": {
    "goal": "测试目标",
    "metric": "核心指标",
    "design": "分组设计",
    "duration": "建议周期"
  }
}
```

### config.py 新增字段
```python
class Settings(BaseSettings):
    llm_base_url: str = "https://api.deepseek.com"
    llm_api_key: str = ""
    llm_model: str = "deepseek-chat"
```

### requirements.txt 新增
```
openai>=1.0.0
```

---

## 4. 前端 AI 集成

### lib/api.ts 扩展
```typescript
async aiInsight(req: AIInsightRequest): Promise<AIInsightResponse> {
  const res = await fetch(`${API_BASE_URL}/ai/insight`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.detail || "AI insight failed")
  }
  return res.json()
}
```

### copilot/page.tsx 状态扩展
```typescript
const [insights, setInsights] = useState<string[]>([])  // 右侧 Business Insights
const [lastRows, setLastRows] = useState<Record<string, unknown>[]>([])
const [showReportModal, setShowReportModal] = useState(false)
const [reportData, setReportData] = useState<AIInsightResponse | null>(null)
```

### handleSend 流程
1. 调用 `POST /chat/query` 获取 rows + chart
2. 调用 `POST /ai/insight` 传入 rows + chart + question + manifest
3. 聊天气泡显示完整 AI 回复（insight + suggestions）
4. 右侧 Business Insights 更新为最新 suggestions

---

## 5. 伪按钮实现细节

### Export CSV（前端纯实现）
```typescript
const exportCSV = (rows: Record<string, unknown>[]) => {
  if (!rows.length) return
  const headers = Object.keys(rows[0]).join(",")
  const body = rows.map(r => Object.values(r).join(",")).join("\n")
  const blob = new Blob([headers + "\n" + body], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `export_${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
```

### Share Report（复制 URL）
```typescript
const shareReport = async () => {
  await navigator.clipboard.writeText(window.location.href)
  show("链接已复制到剪贴板", "success")
}
```

### New Analysis（清空聊天）
```typescript
const newAnalysis = () => {
  setMessages([])
  setInsights([])
  setLastRows([])
}
```

### 生成深度分析报告（Modal）
调用 `/ai/insight`，将结果存入 `reportData`，设置 `showReportModal=true`，渲染 Modal 组件。

---

## 6. LangGraph 预留骨架

```python
# backend/app/graph/agent.py
"""
LangGraph Agent 预留骨架。
当前直接调用 query_service + ai_service。
未来替换为 LangGraph 工作流。
"""

def run_agent(state: dict) -> dict:
    """
    预留接口：未来替换为 LangGraph 工作流。
    当前直接调用服务层。

    Args:
        state: {"dataset_id": str, "question": str, "rows": list, "chart": dict}
    Returns:
        {"insight": str, "suggestions": list, "ab_test": dict}
    """
    from app.services.ai_service import generate_insight
    from app.schemas import AIInsightRequest

    req = AIInsightRequest(**state)
    result = generate_insight(req)
    return result.model_dump()
```

---

## 7. 关键风险与注意事项

1. **layout.tsx Server Component 限制** — `usePathname` 只能在 Client Component 中使用，需抽取 `NavWrapper` 组件
2. **hasDataset 在 layout 层** — NavWrapper 需要读取 DataContext，而 DataProvider 在 layout 中，NavWrapper 必须在 DataProvider 内部渲染
3. **openai SDK 版本** — 需要 `openai>=1.0.0`（新版 API），旧版接口不同
4. **Anthropic OpenAI 兼容** — Anthropic 的兼容端点需要额外 header，建议文档中注明
5. **CSV 特殊字符** — Export CSV 时需处理逗号、换行符等特殊字符（用引号包裹）
6. **Modal 组件** — 项目中暂无 Modal 组件，需新建或用简单 div+overlay 实现

---

## Validation Architecture

### Unit Tests
- `test_ai_service.py` — mock LLM 调用，验证 fallback 逻辑
- `test_ai_endpoint.py` — 验证 `/ai/insight` 端点请求/响应格式

### Integration Tests
- DataContext 跨页面状态共享（上传后切换到 copilot 可见 datasetId）
- Navigation 在路由切换时 header 不重新挂载

### Manual Verification
- 上传 CSV → 切换到 Copilot → 左侧显示 dataset 信息
- 发送问题 → 聊天气泡显示 AI 回复 → 右侧 Insights 更新
- Export CSV → 文件下载
- Share → Toast 提示"链接已复制"
- New Analysis → 聊天清空
- 生成深度分析报告 → Modal 弹窗
