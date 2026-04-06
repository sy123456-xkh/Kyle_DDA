# Chat-to-BI MVP — 前端

## 技术栈

| 组件 | 版本 |
|------|------|
| Next.js | 15 (App Router) |
| React | 19 |
| TypeScript | 5（strict mode） |
| Tailwind CSS | 3 |
| ECharts | 5.6.0 |
| Vitest | 2 |

---

## 快速启动

```bash
cd frontend
cp .env.example .env.local   # 可选，默认已指向 localhost:8000
npm install
npm run dev
```

浏览器访问 `http://localhost:3000`（确保后端已启动）。

---

## 页面说明

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | 项目介绍，进入工作台入口 |
| `/workspace` | 工作台 | 主功能页面（三栏布局） |
| `/data-hub` | 数据中心 | 上传 CSV + 查看 Profile |
| `/copilot` | Copilot | 占位页面（后续 LLM 集成） |

---

## 工作台使用流程

1. **上传数据** — 左栏拖拽或点击上传 CSV（支持 >50MB 前端拦截）
2. **查看 Profile** — 自动展示行数、列类型、缺失率、样本值
3. **配置 Manifest** — 设置时间列、指标列、聚合方式、时间粒度
4. **选择分析方式**：
   - 点击 **Playbook 按钮**（趋势 / Top N / 维度）→ 一键分析
   - 在中栏**输入自然语言问题**→ 发送
5. **查看结果** — 右栏展示 SQL、ECharts 图表、数据表格、耗时
6. **调整图表** — 展开「图表配置」切换类型/字段/颜色/图例

---

## 组件架构

```
app/
├── components/
│   ├── Toast.tsx          # Toast 通知（ToastProvider + useToast hook）
│   ├── ErrorBoundary.tsx  # 错误边界（React class component）
│   ├── Skeleton.tsx       # 加载占位（SkeletonLine/Card/Table）
│   ├── ChartView.tsx      # ECharts 图表（line/bar/pie + overrides）
│   ├── ChartConfig.tsx    # 图表配置面板（折叠，6项配置）
│   ├── DataProfile.tsx    # Profile 三卡片展示
│   ├── Navigation.tsx     # 顶部导航
│   ├── UploadZone.tsx     # 拖拽上传区域
│   └── Silk.tsx           # 首页动态背景（Three.js shader）
├── contexts/
│   └── DataContext.tsx    # 全局状态（dataset_id / profile / loading / error）
└── layout.tsx             # 根布局（注入 ToastProvider）

lib/
└── api.ts                 # API 客户端（uploadDataset / getProfile）

types/
└── index.ts               # TypeScript 类型定义
```

---

## 开发命令

```bash
npm run dev           # 开发服务器（热重载）
npm run build         # 生产构建
npm run lint          # ESLint 检查
npm run format        # Prettier 格式化
npm run format:check  # 格式化检查（CI 用）
npm test              # Vitest 运行测试（60个）
npm run test:coverage # 带覆盖率（当前 52%，components 目录）
npx tsc --noEmit      # TypeScript 类型检查
```

---

## 环境变量

`.env.example`：
```
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000
```

复制为 `.env.local` 并按需修改后端地址。

---

## 常见问题

**页面空白 / API 请求失败**
- 确认后端已启动：`curl http://127.0.0.1:8000/docs`
- 检查 `.env.local` 中的 `NEXT_PUBLIC_API_BASE` 是否正确

**上传后 Profile 不显示**
- 打开浏览器 DevTools → Network，查看 `/profile` 请求是否返回 200
- 确认 CSV 是 UTF-8 编码（GBK 需转码）

**图表不显示**
- 图表仅在执行 Playbook 且返回 `type != "table"` 时显示
- 检查右栏 SQL 是否有错误信息

**TypeScript 编译报错**
```bash
npx tsc --noEmit   # 查看具体错误
```

**测试失败**
```bash
npm test -- --reporter=verbose   # 详细输出
```
