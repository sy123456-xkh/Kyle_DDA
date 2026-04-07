# Phase 10: Copilot 修复与 AI 接入 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-07
**Phase:** 10-copilot-ai-datacontext-copilot-datahub-claude-api-ai-ab
**Areas discussed:** AI 内容展示位置, 伪按钮激活策略, 后端 AI 端点设计, 页面结构

---

## AI 内容展示位置

| Option | Description | Selected |
|--------|-------------|----------|
| 聚合展示：聊天 + 右侧同步 | AI 分析在聊天中回复完整内容，右侧 Business Insights 也实时更新 | ✓ |
| 聊天为主：AI 内容全在聊天 | AI 全部回到聊天气泡，右侧面板保持静态图表展示 | |
| 右侧为主：Insights 面板更新 | AI 分析仅更新右侧面板，聊天中只显示"AI 洞察已生成"的提示 | |
| 独立运作：聊天 AI + 右侧按需展开 | 聊天回复和右侧内容完全独立运作 | |

**User's choice:** 聚合展示：聊天 + 右侧同步

---

**聊天气泡和右侧 Business Insights 内容如何分工？**

| Option | Description | Selected |
|--------|-------------|----------|
| 回复完整内容 | AI 在聊天里回复完整答案，同时将洞察条目提取到右侧 | ✓ |
| 聊天显示摘要 | 聊天里只显示简短摘要，完整内容在右侧面板展开 | |
| 同步相同内容 | 聊天回复和右侧内容完全相同，重复展示 | |

**User's choice:** 回复完整内容

---

**右侧 Business Insights 面板的更新逻辑？**

| Option | Description | Selected |
|--------|-------------|----------|
| 展示最新一次的洞察 | 右侧面板展示最近一次查询的 3-5 条洞察，每次新查询后替换 | ✓ |
| 展示所有历史洞察 | 右侧面板展示所有历史查询的洞察，滚动累加 | |
| 右侧面板不更新 | 右侧面板展示固定内容，不随查询变化 | |

**User's choice:** 展示最新一次的洞察

---

## 伪按钮激活策略

**Export CSV 和 Share Report 按钮的具体行为？**

| Option | Description | Selected |
|--------|-------------|----------|
| Export=下载 CSV, Share=复制 URL | Export CSV 将当前查询结果导出为 CSV 下载，Share 按钮复制当前页面 URL | ✓ |
| Export=后端下载 API, Share=对话框 | Export CSV 调用后端专用下载接口，Share 按钮弹出分享对话框 | |

**User's choice:** Export=下载 CSV, Share=复制 URL

---

**New Analysis 按钮点击后应该做什么？**

| Option | Description | Selected |
|--------|-------------|----------|
| New Analysis = 清空聊天 | 点击清空聊天记录，不切换页面，保留当前 dataset | ✓ |
| New Analysis = 跳转到 Data Hub | 点击跳转回 Data Hub 上传新数据集 | |
| New Analysis = 新 Tab（保留旧聊天） | 点击新建窗口/Tab（如果将来支持多会话） | |

**User's choice:** New Analysis = 清空聊天

---

**Help 和 Feedback 按钮的行为？**

| Option | Description | Selected |
|--------|-------------|----------|
| Help & Feedback = Toast 占位符 | 两个按钮都暂时展示 Toast 提示"功能建设中" | ✓ |
| Help=常见问题列表, Feedback=弹窗占位符 | Help 展开一个小列表显示常用问题或示例提问 | |

**User's choice:** Help & Feedback = Toast 占位符

---

**「生成深度分析报告」按钮的行为？**

| Option | Description | Selected |
|--------|-------------|----------|
| 生成深度分析 = 弹窗展示 | 调用 /ai/insight，结果在 Modal 弹窗中展示完整报告 | ✓ |
| 生成深度分析 = 调用 /ai/insight 更新右侧 | 点击后调用 /ai/insight，结果更新右侧 Business Insights 面板 | |

**User's choice:** 生成深度分析 = 弹窗展示

---

## 后端 AI 端点设计

**后端调用 Claude API 的方式？**

| Option | Description | Selected |
|--------|-------------|----------|
| 可配置提供商（OpenAI 兼容接口） | 通过环境变量配置 LLM_BASE_URL + LLM_API_KEY + LLM_MODEL，支持任意厂商 | ✓ |
| Anthropic SDK 直接调用 | 直接使用 anthropic Python SDK，写死 Claude | |
| 插件式 LLM 接口 | 设计为插件式，支持未来切换不同 LLM 提供商 | |

**User's choice:** 可配置提供商（OpenAI 兼容接口）
**Notes:** 用户明确说"可以自己选择任何厂商的 API，比如 DeepSeek，只需要在后台填入 baseurl 和 apikey"

---

**默认使用哪个 Claude 模型？**

| Option | Description | Selected |
|--------|-------------|----------|
| 读环境变量 | 模型名从 LLM_MODEL 环境变量读取，不写死 | ✓ |
| claude-3-5-haiku | 最快最便宜，适合 MVP 展示 | |
| claude-3-5-sonnet | 最平衡，回复质量更高 | |

**User's choice:** 读环境变量

---

**发送给 Claude 的数据 context 包含什么？**

| Option | Description | Selected |
|--------|-------------|----------|
| schema + 前 20 行样本 | 字段名+类型+前 20 行样本数据，提供足够数据背景 | ✓ |
| 仅 schema，不发数据 | 仅字段名+类型，最信息安全 | |
| 完整 manifest + rows | 发送完整 manifest（含关键字段说明、指标定义等）加 rows | |

**User's choice:** schema + 前 20 行样本

---

**没有配置 API Key 时的行为？**

| Option | Description | Selected |
|--------|-------------|----------|
| 模拟 AI 对话 + 错误提示 | 无 API Key 时模拟 AI 对话（规则生成简单洞察），不阻断流程；但错误场景（如未上传 CSV）仍要提示 | ✓ |
| 优雅 fallback | fallback 返回基于规则的简单 insight，不报错，不阻断流程 | |
| 返回错误 | 无 API Key 时返回错误提示，要求用户配置 | |

**User's choice:** 模拟 AI 对话 + 错误提示
**Notes:** "目前先专注于前端修改以及功能完整性，可以模拟 AI 对话，但是错误也要提示（比如没有上传 CSV），不阻断流程"

---

## 页面结构

**页面结构如何处理？**

| Option | Description | Selected |
|--------|-------------|----------|
| 保持分离，修复断层 | 保持 /data-hub 和 /copilot 两个独立页面，修复 DataContext 断层后数据自然流通 | |
| 合并为单一 /workspace 页面 | 将 data-hub 和 copilot 合并为一个页面，左栏上传，中间聊天，右侧图表+洞察 | |
| 保持分离，但 Copilot 内嵌入上传 | 保持现有页面结构，但在 /copilot 页面左栏内嵌入一个轻量级上传入口 | |

**User's choice:** 保持分离（但共享 header，切换时丝滑）
**Notes:** "保持分离，但是对于 copilot 来说，他和 datahub 共用一个前端，我的意思是在 datahub 页面点击 copilot 可以实现像页面换页一页丝滑，而不是整个前端格局切换"

---

**如何实现 header 不动的丝滑切换？**

| Option | Description | Selected |
|--------|-------------|----------|
| Navigation 移入 layout.tsx | 将 Navigation 组件移入 layout.tsx，使 header 在页面切换时位置固定不动 | ✓ |
| 两页各自引入 Navigation | 两个页面各自引入 Navigation 组件，依赖 Next.js 路由切换的自然行为 | |

**User's choice:** Navigation 移入 layout.tsx

---

## Claude's Discretion

- AI 回复的具体 prompt 模板措辞（参考用户提供的骨架）
- LangGraph agent.py 骨架的具体函数签名
- Export CSV 的文件命名规则
- Modal 弹窗的具体样式（与现有 UI 风格一致）

## Deferred Ideas

- LangGraph 完整集成 — 本次仅预留骨架，未来 M2 实现
- 多会话/多 Tab 支持 — New Analysis 目前只清空聊天
- 图表导出/下载 — Phase 6 已决定不做
- Playbook 按钮 UI（trend/topn/cross）— 用户提到但需规划时确认是否在 Phase 10 范围内
