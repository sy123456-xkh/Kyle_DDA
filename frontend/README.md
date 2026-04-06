# Chat-to-BI MVP — 前端

## 技术栈

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS

## 快速启动

```bash
cd frontend
cp .env.example .env.local   # 可选，默认指向 localhost:8000
npm install
npm run dev
```

浏览器访问 `http://localhost:3000`。

## 使用流程

1. 确保后端已启动 (`cd backend && uvicorn app.main:app --reload`)
2. 左栏点击或拖拽上传 CSV 文件 → 自动展示字段 Profile
3. 中栏输入自然语言问题 → 发送
4. 右栏查看 SQL、执行结果表格、耗时等元信息
