---
phase: 06-data-visualization
created: 2026-04-04
decisions_by: user
---

# Phase 6 Context: 数据可视化

## 已锁定决策

### 图表库
- **选择：ECharts 5.6.0**（继续使用，不换 Recharts）
- **原因：** 已集成、已有 line/bar 完整实现、功能更强大
- **影响：** 路线图原写 Recharts，实际以 ECharts 为准

### 图表类型
- **已有：** line（折线图）、bar（柱状图）
- **新增：** pie（饼图）
- **总计：** 3 种基础图表，满足验收标准
- **不做：** scatter、heatmap（MVP 不需要）

### 图表推荐策略
- **后端：** 保留现有 playbook 规则推荐（trend→line, topN→bar）
- **前端：** 用户可手动切换图表类型（line ↔ bar ↔ pie）
- **不做：** 前端智能推荐算法

### 图表配置面板
- **范围：完整配置面板**
- **包含：**
  - 图表类型切换（line / bar / pie）
  - X/Y 轴字段选择（从查询结果列中选）
  - 颜色主题切换
  - 标题自定义
  - 图例位置（上/下/左/右）
- **位置：** workspace 右侧面板，图表下方或折叠面板

## 现有代码基础

### 后端 ChartSpec（已有，来自 schemas.py）
```python
class ChartSpec(BaseModel):
    type: str  # "line" | "bar" | "table" → 需新增 "pie"
    title: str = ""
    x: Optional[str] = None
    y: Optional[Union[str, list[str]]] = None
    series: Optional[str] = None
    data: list[dict] = []
```

### 前端 ECharts 集成（已有，来自 workspace/page.tsx）
- chartDomRef + useEffect 动态 import
- 支持 line（smooth 曲线+渐变）、bar（渐变填充）
- 响应式 resize + 清理
- 暗色主题风格（indigo/purple 色系）

### 后端 Playbook（已有，来自 query_service.py）
- Trend playbook → line chart
- TopN playbook → bar chart
- Cross playbook → table（可考虑扩展为 pie）

## 实现方向

1. **后端：** ChartSpec.type 新增 "pie" 支持，Cross playbook 考虑返回 pie 而非 table
2. **前端图表：** workspace 中 ECharts useEffect 新增 pie 渲染分支
3. **前端配置面板：** 新建 ChartConfig 组件，放在图表下方
4. **类型切换：** 配置面板切换 type 时前端重新渲染，不重新请求后端

## 不做的事

- 不换 Recharts
- 不做图表导出/下载（截图/PDF）
- 不做多图表并排
- 不做 3D 图表
- 不做图表动画自定义
