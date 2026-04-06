# Chat-to-BI MVP

> 上传 CSV → 自然语言提问 → SQL 自动生成 → 图表可视化
>
> 毕业项目 Demo · 本地单机运行 · Python + Next.js + DuckDB

---

## 功能概览

| 功能 | 说明 |
|------|------|
| 📁 CSV 上传 | 拖拽或点击上传，自动建表 + 视图，支持 >50MB 前端拦截 |
| 🔍 数据 Profile | 字段类型、缺失率、样本值一目了然 |
| 💬 自然语言查询 | 规则引擎匹配 → 生成 SQL → DuckDB 执行 |
| 📊 Playbook 分析 | 趋势分析（折线图）、Top N（柱状图）、维度分析（饼图） |
| 🎨 图表配置 | 类型切换 / X·Y 轴选择 / 颜色主题 / 图例位置 |
| 🛡️ SQL 护栏 | 仅允许 SELECT，自动补 LIMIT，拒绝注入 |

---

## 快速启动

### 前置要求

- Python 3.11+
- Node.js 18+
- macOS（本地开发）

### 1. 启动后端

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

后端运行在 `http://127.0.0.1:8000`，访问 `http://127.0.0.1:8000/docs` 查看 Swagger UI。

### 2. 启动前端

```bash
cd frontend
cp .env.example .env.local   # 可选，默认已指向 localhost:8000
npm install
npm run dev
```

前端运行在 `http://localhost:3000`。

---

## 项目结构

```
.
├── backend/                # FastAPI 后端
│   ├── app/
│   │   ├── main.py         # 路由入口
│   │   ├── schemas.py      # Pydantic 模型
│   │   ├── db.py           # DuckDB 连接管理
│   │   ├── config.py       # 配置（pydantic-settings）
│   │   ├── exceptions.py   # 自定义异常
│   │   └── services/
│   │       ├── dataset_service.py  # 上传、Profile、Manifest
│   │       └── query_service.py    # SQL 生成、护栏、Playbook
│   ├── tests/              # pytest 测试套件（覆盖率 76%）
│   ├── data/               # DuckDB 文件 + CSV 存储（git ignore）
│   ├── pyproject.toml      # black / ruff / mypy 配置
│   └── requirements.txt
│
├── frontend/               # Next.js 前端
│   ├── app/
│   │   ├── workspace/      # 主工作台（三栏布局）
│   │   ├── data-hub/       # 数据上传与 Profile
│   │   ├── copilot/        # Copilot 页面（占位）
│   │   ├── components/     # 公共组件
│   │   └── contexts/       # React Context 状态管理
│   ├── lib/api.ts          # API 客户端封装
│   ├── types/index.ts      # TypeScript 类型定义
│   ├── tests/              # Vitest 组件测试（60个，52%覆盖率）
│   └── package.json
│
└── .planning/              # GSD 规划文档（非业务代码）
```

---

## 使用流程

1. **上传数据** — 左栏拖拽或点击上传 CSV，等待 Profile 加载完成
2. **查看字段** — Profile 展示行数、列类型、缺失率、样本值
3. **配置字段** — 在 Manifest 面板设置时间列、指标列、聚合方式
4. **选择分析** — 点击 Playbook 按钮（趋势 / Top N / 维度）或直接输入问题
5. **查看结果** — 右栏展示 SQL、图表、数据表格
6. **调整图表** — 展开"图表配置"切换类型、字段、颜色、图例

---

## API 文档

启动后端后访问：`http://127.0.0.1:8000/docs`（Swagger UI 交互式文档）

完整 API 说明见 [`backend/README.md`](./backend/README.md)。

---

## 开发命令速查

### 后端

```bash
source .venv/bin/activate

# 运行测试
pytest                              # 运行所有测试
pytest --cov=app --cov-report=term  # 带覆盖率

# 代码质量
python -m black app/                # 格式化
python -m ruff check app/           # lint 检查
python -m mypy app/                 # 类型检查
```

### 前端

```bash
npm run dev           # 开发服务器
npm run build         # 生产构建
npm run lint          # ESLint 检查
npm run format        # Prettier 格式化
npm test              # 运行测试
npm run test:coverage # 带覆盖率
npx tsc --noEmit      # TypeScript 类型检查
```

---

## 常见问题

见 [`backend/README.md`](./backend/README.md) 故障排查章节。
