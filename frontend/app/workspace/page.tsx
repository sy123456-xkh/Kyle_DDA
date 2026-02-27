"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

/* ── 类型 ───────────────────────────────────────────── */
interface ColumnInfo { name: string; type: string; }
interface MissingRate { name: string; missing_rate: number; }
interface SampleValues { name: string; values: unknown[]; }
interface Profile {
  row_count: number;
  columns: ColumnInfo[];
  missing_rate: MissingRate[];
  sample_values: SampleValues[];
}
interface Manifest {
  dataset_id: string;
  view_name: string | null;
  primary_time_col: string | null;
  metric_col: string | null;
  metric_agg: string;
  time_grain: string;
  dimension_candidates: string[];
  metric_candidates: string[];
}
interface QueryMeta { trace_id: string; elapsed_ms: number; row_count: number; }
interface ChartSpec {
  type: "line" | "bar" | "table";
  title: string;
  x: string | null;
  y: string | string[] | null;
  series: string | null;
  data: Record<string, unknown>[];
}
interface QueryResult {
  sql: string;
  rows: Record<string, unknown>[];
  meta: QueryMeta;
  chart?: ChartSpec;
}
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  result?: QueryResult;
}
interface HistoryEntry {
  question: string;
  sql: string;
  meta: QueryMeta;
  timestamp: string;
  result?: QueryResult;
}

/* ── 图标 ───────────────────────────────────────────── */
const Ico = ({ d, size = 16, className = "" }: { d: string; size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

/* ── 主工作台 ───────────────────────────────────────── */
export default function WorkspacePage() {
  // 数据集
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // 聊天
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [querying, setQuerying] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 右栏
  const [activeResult, setActiveResult] = useState<QueryResult | null>(null);
  const [copied, setCopied] = useState(false);

  // History
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Playbook 选择列
  const [dimCol, setDimCol] = useState<string>("");

  // ECharts ref
  const chartDomRef = useRef<HTMLDivElement>(null);

  // 加载历史
  useEffect(() => {
    try {
      const saved = localStorage.getItem("bi_history");
      if (saved) setHistory(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  // 保存历史
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("bi_history", JSON.stringify(history.slice(0, 50)));
    }
  }, [history]);

  // 自动滚动
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ECharts 渲染
  useEffect(() => {
    const dom = chartDomRef.current;
    const chartSpec = activeResult?.chart;

    if (!dom || !chartSpec || chartSpec.type === "table" || chartSpec.data.length === 0) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let instance: any = null;
    let cancelled = false;
    let resizeHandler: (() => void) | null = null;

    import("echarts").then((echarts) => {
      if (cancelled || !dom || !dom.isConnected) return;

      instance = echarts.init(dom);

      const xKey = chartSpec.x!;
      const yKey = Array.isArray(chartSpec.y) ? chartSpec.y[0] : chartSpec.y!;
      const xData = chartSpec.data.map((d) => String(d[xKey] ?? ""));
      const yData = chartSpec.data.map((d) => Number(d[yKey]) || 0);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let option: any;

      if (chartSpec.type === "line") {
        option = {
          backgroundColor: "transparent",
          title: { text: chartSpec.title, left: "center", top: 4, textStyle: { color: "#e2e8f0", fontSize: 14, fontWeight: "500" } },
          grid: { left: 56, right: 16, top: 40, bottom: 28 },
          tooltip: { trigger: "axis", backgroundColor: "#1a2035", borderColor: "#2a3454", textStyle: { color: "#e2e8f0", fontSize: 12 } },
          xAxis: {
            type: "category",
            data: xData,
            axisLine: { lineStyle: { color: "#2a3454" } },
            axisLabel: { color: "#94a3b8", fontSize: 10 },
          },
          yAxis: {
            type: "value",
            axisLine: { show: false },
            axisLabel: { color: "#94a3b8", fontSize: 10 },
            splitLine: { lineStyle: { color: "#1e293b" } },
          },
          series: [{
            type: "line",
            data: yData,
            smooth: true,
            symbol: "circle",
            symbolSize: 5,
            lineStyle: { color: "#6366f1", width: 2 },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "rgba(99, 102, 241, 0.25)" },
                { offset: 1, color: "rgba(99, 102, 241, 0.02)" },
              ]),
            },
            itemStyle: { color: "#6366f1" },
          }],
        };
      } else if (chartSpec.type === "bar") {
        const needRotate = xData.some((s) => s.length > 6);
        option = {
          backgroundColor: "transparent",
          title: { text: chartSpec.title, left: "center", top: 4, textStyle: { color: "#e2e8f0", fontSize: 14, fontWeight: "500" } },
          grid: { left: 56, right: 16, top: 40, bottom: needRotate ? 56 : 28 },
          tooltip: { trigger: "axis", backgroundColor: "#1a2035", borderColor: "#2a3454", textStyle: { color: "#e2e8f0", fontSize: 12 } },
          xAxis: {
            type: "category",
            data: xData,
            axisLine: { lineStyle: { color: "#2a3454" } },
            axisLabel: { color: "#94a3b8", fontSize: 10, rotate: needRotate ? 30 : 0 },
          },
          yAxis: {
            type: "value",
            axisLine: { show: false },
            axisLabel: { color: "#94a3b8", fontSize: 10 },
            splitLine: { lineStyle: { color: "#1e293b" } },
          },
          series: [{
            type: "bar",
            data: yData,
            barMaxWidth: 36,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#818cf8" },
                { offset: 1, color: "#4f46e5" },
              ]),
              borderRadius: [4, 4, 0, 0],
            },
          }],
        };
      }

      if (option) instance.setOption(option);

      resizeHandler = () => instance?.resize();
      window.addEventListener("resize", resizeHandler);
    });

    return () => {
      cancelled = true;
      if (resizeHandler) window.removeEventListener("resize", resizeHandler);
      if (instance) instance.dispose();
    };
  }, [activeResult]);

  /* ── 上传 CSV ──────────────────────────────────────── */
  const handleUpload = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setUploadError("仅支持 .csv 文件");
      return;
    }
    setUploading(true);
    setUploadError(null);
    setProfile(null);
    setManifest(null);
    setMessages([]);
    setActiveResult(null);

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API}/datasets/upload`, { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json()).detail || "上传失败");
      const data = await res.json();
      setDatasetId(data.dataset_id);

      // 并行获取 profile + manifest
      const [pRes, mRes] = await Promise.all([
        fetch(`${API}/datasets/${data.dataset_id}/profile`),
        fetch(`${API}/datasets/${data.dataset_id}/manifest`),
      ]);
      if (pRes.ok) setProfile(await pRes.json());
      if (mRes.ok) setManifest(await mRes.json());
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "未知错误");
    } finally {
      setUploading(false);
    }
  }, []);

  /* ── Manifest 更新 ─────────────────────────────────── */
  const updateManifest = async (field: "primary_time_col" | "metric_col" | "metric_agg" | "time_grain", value: string) => {
    if (!datasetId) return;
    const body: Record<string, string> = { [field]: value };
    const res = await fetch(`${API}/datasets/${datasetId}/manifest`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) setManifest(await res.json());
  };

  /* ── 通用结果处理 ──────────────────────────────────── */
  const handleResult = (q: string, data: QueryResult) => {
    const aMsg: ChatMessage = {
      role: "assistant",
      content: `查询完成，返回 ${data.meta.row_count} 行，耗时 ${data.meta.elapsed_ms}ms`,
      result: data,
    };
    setMessages((prev) => [...prev, aMsg]);
    setActiveResult(data);
    setHistory((prev) => [
      { question: q, sql: data.sql, meta: data.meta, timestamp: new Date().toLocaleString(), result: data },
      ...prev,
    ]);
  };

  /* ── 发送查询 ──────────────────────────────────────── */
  const handleQuery = async () => {
    if (!question.trim() || !datasetId || querying) return;
    const q = question;
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setQuestion("");
    setQuerying(true);

    try {
      const res = await fetch(`${API}/chat/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataset_id: datasetId, question: q }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((prev) => [...prev, { role: "assistant", content: `查询失败: ${data.detail}` }]);
        return;
      }
      handleResult(q, data);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "网络错误，请检查后端是否启动" }]);
    } finally {
      setQuerying(false);
    }
  };

  /* ── Playbook 执行 ─────────────────────────────────── */
  const runPlaybook = async (playbook: string) => {
    if (!datasetId || querying) return;
    const body: Record<string, string | null> = {
      dataset_id: datasetId,
      playbook,
      time_col: manifest?.primary_time_col || null,
      metric_col: manifest?.metric_col || null,
      dim_col: dimCol || null,
    };

    const label = { trend: "趋势分析", topn: "Top N 排行", cross: "交叉分析" }[playbook] || playbook;
    setMessages((prev) => [...prev, { role: "user", content: `[Playbook] ${label}` }]);
    setQuerying(true);

    try {
      const res = await fetch(`${API}/playbook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((prev) => [...prev, { role: "assistant", content: `Playbook 执行失败: ${data.detail}` }]);
        return;
      }
      handleResult(label, data);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "网络错误" }]);
    } finally {
      setQuerying(false);
    }
  };

  /* ── 下载 CSV ──────────────────────────────────────── */
  const downloadCSV = () => {
    if (!activeResult?.sql || !datasetId) return;
    const url = `${API}/datasets/${datasetId}/download?sql=${encodeURIComponent(activeResult.sql)}`;
    window.open(url, "_blank");
  };

  /* ── 复制 SQL ──────────────────────────────────────── */
  const copySQL = (sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── 回放历史 ──────────────────────────────────────── */
  const replayHistory = (entry: HistoryEntry) => {
    if (entry.result) {
      setActiveResult(entry.result);
    }
    setHistoryOpen(false);
  };

  const rateTag = (r: number) => r === 0 ? "tag-rate-ok" : r < 0.1 ? "tag-rate-warn" : "tag-rate-bad";

  const numericCols = profile?.columns.filter((c) => ["BIGINT", "INTEGER", "DOUBLE", "FLOAT", "DECIMAL", "SMALLINT"].includes(c.type.toUpperCase())) || [];
  const allCols = profile?.columns || [];

  const showChart = activeResult?.chart && activeResult.chart.type !== "table" && activeResult.chart.data.length > 0;

  /* ── 渲染 ─────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-screen">
      {/* 顶栏 */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              IF
            </div>
            <h1 className="text-lg font-semibold tracking-tight">InsightFlow</h1>
          </Link>
          <span className="text-xs text-[var(--text-muted)] ml-1">Workspace</span>
        </div>
        <div className="flex items-center gap-4">
          {datasetId && (
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] animate-fade-in">
              <Ico d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5M3 5c0 1.66 4 3 9 3s9-1.34 9-3S16.97 2 12 2 3 3.34 3 5" />
              <span className="font-mono">{datasetId}</span>
              <span className="tag tag-type">{profile?.row_count ?? "?"} 行</span>
            </div>
          )}
          <span className="text-[10px] text-[var(--text-muted)]">by KyleStudios</span>
        </div>
      </header>

      {/* 三栏 */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── 左栏 ──────────────────────────────────────── */}
        <aside className="w-80 flex-shrink-0 border-r border-[var(--border)] flex flex-col bg-[var(--bg-secondary)]">
          {/* 上传 */}
          <div className="p-4 border-b border-[var(--border)]">
            <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">数据源</h2>
            <div
              className={`upload-zone ${dragOver ? "drag-over" : ""}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleUpload(f); }}
            >
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-[var(--text-secondary)]">导入中<span className="loading-dots" /></span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-[var(--text-muted)]">
                  <Ico d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" size={28} />
                  <span className="text-sm">点击或拖拽 CSV 文件</span>
                </div>
              )}
            </div>
            {uploadError && <p className="mt-2 text-xs text-[var(--danger)] animate-fade-in">{uploadError}</p>}
          </div>

          {/* Manifest 配置 */}
          {profile && manifest && (
            <div className="p-4 border-b border-[var(--border)] animate-slide-up">
              <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Manifest 配置</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-[var(--text-muted)] block mb-1">时间列</label>
                  <select className="select-field" value={manifest.primary_time_col || ""} onChange={(e) => updateManifest("primary_time_col", e.target.value)}>
                    <option value="">-- 未选择 --</option>
                    {allCols.map((c) => <option key={c.name} value={c.name}>{c.name} ({c.type})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] block mb-1">指标列</label>
                  <select className="select-field" value={manifest.metric_col || ""} onChange={(e) => updateManifest("metric_col", e.target.value)}>
                    <option value="">-- 未选择 --</option>
                    {numericCols.map((c) => <option key={c.name} value={c.name}>{c.name} ({c.type})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] block mb-1">维度列 (Playbook 用)</label>
                  <select className="select-field" value={dimCol} onChange={(e) => setDimCol(e.target.value)}>
                    <option value="">-- 未选择 --</option>
                    {allCols.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-[var(--text-muted)] block mb-1">聚合方式</label>
                    <select className="select-field" value={manifest.metric_agg || "sum"} onChange={(e) => updateManifest("metric_agg", e.target.value)}>
                      <option value="sum">SUM (求和)</option>
                      <option value="avg">AVG (平均)</option>
                      <option value="count">COUNT (计数)</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-[var(--text-muted)] block mb-1">时间粒度</label>
                    <select className="select-field" value={manifest.time_grain || "day"} onChange={(e) => updateManifest("time_grain", e.target.value)}>
                      <option value="day">Day (天)</option>
                      <option value="week">Week (周)</option>
                      <option value="month">Month (月)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Playbook */}
              <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mt-4 mb-2">Playbook</h3>
              <div className="space-y-2">
                <button className="playbook-btn" onClick={() => runPlaybook("trend")} disabled={querying}>
                  <span className="pb-icon trend"><Ico d="M22 12l-4-4v3H3v2h15v3l4-4z" size={14} /></span>
                  <span>趋势分析</span>
                </button>
                <button className="playbook-btn" onClick={() => runPlaybook("topn")} disabled={querying}>
                  <span className="pb-icon topn"><Ico d="M18 20V10M12 20V4M6 20v-6" size={14} /></span>
                  <span>Top N 排行</span>
                </button>
                <button className="playbook-btn" onClick={() => runPlaybook("cross")} disabled={querying}>
                  <span className="pb-icon cross"><Ico d="M3 3v18h18M7 16l4-4 4 4 5-6" size={14} /></span>
                  <span>交叉分析</span>
                </button>
              </div>
            </div>
          )}

          {/* Profile */}
          {profile && (
            <div className="flex-1 overflow-y-auto p-4 animate-slide-up">
              <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">字段概览 · {profile.columns.length} 列</h3>
              <div className="space-y-2">
                {profile.columns.map((col, i) => {
                  const miss = profile.missing_rate[i]?.missing_rate ?? 0;
                  const samp = profile.sample_values[i]?.values ?? [];
                  return (
                    <div key={col.name} className="glass-card p-3 animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-[var(--text-primary)]">{col.name}</span>
                        <span className="tag tag-type">{col.type}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-[var(--text-muted)]">缺失率</span>
                        <span className={`tag ${rateTag(miss)}`}>{(miss * 100).toFixed(1)}%</span>
                        <div className="flex-1 h-1 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(miss * 100, 0.5)}%`, background: miss === 0 ? "#34d399" : miss < 0.1 ? "#fbbf24" : "#f87171" }} />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {samp.slice(0, 3).map((v, j) => (
                          <span key={j} className="text-xs px-1.5 py-0.5 rounded bg-[var(--bg-primary)] text-[var(--text-muted)] truncate max-w-[90px]" title={String(v)}>{String(v)}</span>
                        ))}
                        {samp.length > 3 && <span className="text-xs text-[var(--text-muted)]">+{samp.length - 3}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        {/* ── 中栏：聊天 ────────────────────────────────── */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* History 抽屉 */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
            <button className="btn-ghost !py-1 !px-3 text-xs flex items-center gap-1.5" onClick={() => setHistoryOpen(!historyOpen)}>
              <Ico d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" size={12} />
              历史记录 ({history.length})
              <svg width="10" height="10" viewBox="0 0 10 6" fill="none" className={`transition-transform ${historyOpen ? "rotate-180" : ""}`}>
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <div className={`history-panel ${historyOpen ? "open" : ""}`}>
            {history.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-4">暂无查询历史</p>
            ) : (
              <div className="space-y-1">
                {history.map((h, i) => (
                  <div key={i} className="history-item" onClick={() => replayHistory(h)}>
                    <span className="text-[var(--text-muted)] flex-shrink-0 w-[120px] truncate">{h.timestamp}</span>
                    <span className="text-[var(--text-secondary)] truncate flex-1">{h.question}</span>
                    <span className="tag-trace flex-shrink-0">{h.meta.trace_id}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 聊天消息 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] gap-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center border border-[var(--border)]">
                  <Ico d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" size={28} />
                </div>
                <p className="text-sm">{datasetId ? "输入问题或使用 Playbook 开始分析" : "请先上传 CSV 文件"}</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-slide-up`}>
                <div className={`max-w-[75%] px-4 py-2.5 text-sm ${msg.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant"}`}>
                  <p>{msg.content}</p>
                  {msg.result && (
                    <button className="mt-2 text-xs text-[var(--accent)] hover:underline" onClick={() => setActiveResult(msg.result!)}>
                      查看结果 →
                    </button>
                  )}
                </div>
              </div>
            ))}
            {querying && (
              <div className="flex justify-start animate-fade-in">
                <div className="chat-bubble-assistant px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">查询中</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* 输入区 */}
          <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
            <div className="flex gap-2">
              <input
                className="input-field flex-1"
                placeholder={datasetId ? "输入你的数据问题..." : "请先上传 CSV 文件..."}
                disabled={!datasetId || querying}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuery()}
              />
              <button className="btn-primary flex items-center gap-2 whitespace-nowrap" disabled={!datasetId || !question.trim() || querying} onClick={handleQuery}>
                <Ico d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" size={16} />
                发送
              </button>
            </div>
            {datasetId && (
              <div className="flex gap-2 mt-2">
                {["这个数据有多少行？", "展示所有数据", "count"].map((q) => (
                  <button key={q} className="btn-ghost text-xs" onClick={() => setQuestion(q)}>{q}</button>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* ── 右栏：结果 + 图表 ──────────────────────────── */}
        <aside className="w-[440px] flex-shrink-0 border-l border-[var(--border)] flex flex-col bg-[var(--bg-secondary)]">
          {activeResult ? (
            <div className="flex flex-col h-full animate-fade-in">
              {/* 图表区 */}
              {showChart && (
                <div className="p-4 border-b border-[var(--border)]">
                  <div ref={chartDomRef} style={{ width: "100%", height: "260px" }} />
                </div>
              )}

              {/* SQL + 操作按钮 */}
              <div className="p-4 border-b border-[var(--border)]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">SQL 查询</h3>
                  <div className="flex gap-1">
                    <button className="btn-ghost flex items-center gap-1 !py-1 !px-2" onClick={() => copySQL(activeResult.sql)}>
                      {copied
                        ? <><Ico d="M20 6L9 17l-5-5" size={12} className="stroke-[#34d399]" /> 已复制</>
                        : <><Ico d="M9 9h13v13H9zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" size={12} /> 复制</>
                      }
                    </button>
                    <button className="btn-ghost flex items-center gap-1 !py-1 !px-2" onClick={downloadCSV}>
                      <Ico d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" size={12} />
                      下载 CSV
                    </button>
                  </div>
                </div>
                <div className="sql-block">{activeResult.sql}</div>
              </div>

              {/* 证据区 Meta */}
              <div className="px-4 py-2.5 flex items-center gap-3 border-b border-[var(--border)] text-xs flex-wrap">
                <span className="tag-trace">{activeResult.meta.trace_id}</span>
                <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                  {activeResult.meta.row_count} 行
                </span>
                <span className="text-[var(--text-muted)]">{activeResult.meta.elapsed_ms}ms</span>
              </div>

              {/* 数据表 */}
              <div className="flex-1 overflow-auto p-4">
                {activeResult.rows.length > 0 ? (
                  <table className="data-table">
                    <thead>
                      <tr>{Object.keys(activeResult.rows[0]).map((k) => <th key={k}>{k}</th>)}</tr>
                    </thead>
                    <tbody>
                      {activeResult.rows.map((row, i) => (
                        <tr key={i}>
                          {Object.values(row).map((v, j) => (
                            <td key={j} title={String(v ?? "NULL")}>
                              {v === null ? <span className="text-[var(--text-muted)] italic">NULL</span> : String(v)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">无数据</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] gap-3">
              <div className="w-16 h-16 rounded-2xl bg-[var(--bg-card)] flex items-center justify-center border border-[var(--border)]">
                <Ico d="M3 3h18v18H3zM3 9h18M9 21V9" size={28} />
              </div>
              <p className="text-sm">查询结果将在此展示</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
