"use client";

import { useState } from "react";
import type { ChartOverrides } from "./ChartView";
import { COLOR_THEMES } from "./ChartView";

/* ── Types ─────────────────────────────────────────── */
interface ChartSpec {
  type: "line" | "bar" | "pie" | "table";
  title: string;
  x: string | null;
  y: string | string[] | null;
  series: string | null;
  data: Record<string, unknown>[];
}

interface ChartConfigProps {
  spec: ChartSpec;
  columns: string[];
  overrides: ChartOverrides;
  onChange: (overrides: ChartOverrides) => void;
}

/* ── Chart type icons (simple SVG paths) ───────────── */
const TYPE_ICONS: Record<string, { label: string; d: string }> = {
  line: { label: "折线图", d: "M3 17l4-4 4 4 4-8 5 5" },
  bar:  { label: "柱状图", d: "M18 20V10M12 20V4M6 20v-6" },
  pie:  { label: "饼图",   d: "M12 2a10 10 0 0 1 10 10h-10V2zM12 12L2.05 14.5A10 10 0 0 0 12 22a10 10 0 0 0 9.95-8.5L12 12z" },
};

/* ── Legend position icons ─────────────────────────── */
const LEGEND_POS: { key: ChartOverrides["legendPosition"]; label: string; d: string }[] = [
  { key: "top",    label: "上", d: "M12 5l-5 5h10l-5-5z" },
  { key: "bottom", label: "下", d: "M12 19l-5-5h10l-5 5z" },
  { key: "left",   label: "左", d: "M5 12l5-5v10l-5-5z" },
  { key: "right",  label: "右", d: "M19 12l-5-5v10l5-5z" },
];

/* ── Color theme keys ─────────────────────────────── */
const THEME_KEYS = Object.keys(COLOR_THEMES) as Array<keyof typeof COLOR_THEMES>;

/* ── Component ─────────────────────────────────────── */
export default function ChartConfig({ spec, columns, overrides, onChange }: ChartConfigProps) {
  const [open, setOpen] = useState(false);

  const currentType = overrides.type ?? spec.type;
  const isPie = currentType === "pie";
  const update = (patch: Partial<ChartOverrides>) => {
    onChange({ ...overrides, ...patch });
  };

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--bg-card)]">
      {/* Header — toggle */}
      <button
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider hover:bg-[var(--bg-secondary)] transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          图表配置
        </span>
        <svg width="12" height="12" viewBox="0 0 12 8" fill="none" className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Collapsible body */}
      <div
        className="transition-all duration-200 ease-in-out overflow-hidden"
        style={{ maxHeight: open ? "600px" : "0px", opacity: open ? 1 : 0 }}
      >
        <div className="px-3 pb-3 space-y-3">
          {/* ── Chart type ─────────────────────────── */}
          <div>
            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">图表类型</label>
            <div className="flex gap-1.5">
              {(Object.entries(TYPE_ICONS) as [string, { label: string; d: string }][]).map(([type, { label, d }]) => {
                const active = currentType === type;
                return (
                  <button
                    key={type}
                    title={label}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs transition-all ${
                      active
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        : "bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                    }`}
                    onClick={() => update({ type: type as ChartOverrides["type"] })}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d={d} />
                    </svg>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── X axis ─────────────────────────────── */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider w-16 flex-shrink-0">
              {isPie ? "分类字段" : "X 轴"}
            </label>
            <select
              className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
              value={overrides.x ?? spec.x ?? ""}
              onChange={(e) => update({ x: e.target.value || null })}
            >
              <option value="">-- 默认 --</option>
              {columns.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* ── Y axis ─────────────────────────────── */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider w-16 flex-shrink-0">
              {isPie ? "数值字段" : "Y 轴"}
            </label>
            <select
              className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
              value={(Array.isArray(overrides.y) ? overrides.y[0] : overrides.y) ?? (Array.isArray(spec.y) ? spec.y[0] : spec.y) ?? ""}
              onChange={(e) => update({ y: e.target.value || null })}
            >
              <option value="">-- 默认 --</option>
              {columns.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* ── Title ──────────────────────────────── */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider w-16 flex-shrink-0">标题</label>
            <input
              type="text"
              className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-muted)]"
              placeholder={spec.title || "图表标题"}
              value={overrides.title ?? ""}
              onChange={(e) => update({ title: e.target.value || undefined })}
            />
          </div>

          {/* ── Color theme ────────────────────────── */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider w-16 flex-shrink-0">配色</label>
            <div className="flex gap-1.5">
              {THEME_KEYS.map((key) => {
                const active = (overrides.colorTheme ?? "indigo") === key;
                return (
                  <button
                    key={key}
                    title={key}
                    className={`w-6 h-6 rounded border-2 transition-all ${
                      active ? "border-amber-400 scale-110" : "border-transparent hover:border-[var(--text-muted)]"
                    }`}
                    style={{ backgroundColor: COLOR_THEMES[key][0] }}
                    onClick={() => update({ colorTheme: key as ChartOverrides["colorTheme"] })}
                  />
                );
              })}
            </div>
          </div>

          {/* ── Legend position ─────────────────────── */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider w-16 flex-shrink-0">图例</label>
            <div className="flex gap-1.5">
              {LEGEND_POS.map(({ key, label, d }) => {
                const active = (overrides.legendPosition ?? "bottom") === key;
                return (
                  <button
                    key={key}
                    title={label}
                    className={`w-7 h-7 rounded flex items-center justify-center transition-all ${
                      active
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        : "bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text-secondary)]"
                    }`}
                    onClick={() => update({ legendPosition: key })}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d={d} />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
