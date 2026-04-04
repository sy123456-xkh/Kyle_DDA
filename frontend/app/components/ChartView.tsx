"use client";

import { useRef, useEffect } from "react";

/* ── Types ─────────────────────────────────────────── */
interface ChartSpec {
  type: "line" | "bar" | "pie" | "table";
  title: string;
  x: string | null;
  y: string | string[] | null;
  series: string | null;
  data: Record<string, unknown>[];
}

export interface ChartOverrides extends Partial<ChartSpec> {
  colorTheme?: "indigo" | "amber" | "emerald" | "rose";
  legendPosition?: "top" | "bottom" | "left" | "right";
}

export const COLOR_THEMES: Record<string, string[]> = {
  indigo: ["#6366f1", "#818cf8", "#a5b4fc", "#4f46e5", "#312e81"],
  amber: ["#f59e0b", "#fbbf24", "#fcd34d", "#d97706", "#92400e"],
  emerald: ["#10b981", "#34d399", "#6ee7b7", "#059669", "#064e3b"],
  rose: ["#f43f5e", "#fb7185", "#fda4af", "#e11d48", "#881337"],
};

/* ── ChartView Props ──────────────────────────────── */interface ChartViewProps {
  spec: ChartSpec;
  overrides?: ChartOverrides;
  className?: string;
}

/* ── Component ─────────────────────────────────────── */
export default function ChartView({ spec, overrides, className }: ChartViewProps) {
  const domRef = useRef<HTMLDivElement>(null);

  /* Merge spec + overrides (non-undefined fields win) */
  const merged = { ...spec } as ChartSpec & ChartOverrides;
  if (overrides) {
    for (const [k, v] of Object.entries(overrides)) {
      if (v !== undefined) (merged as unknown as Record<string, unknown>)[k] = v;
    }
  }
  /* Skip rendering for table type or empty data */
  const shouldRender =
    merged.type !== "table" && merged.data && merged.data.length > 0;

  useEffect(() => {
    const dom = domRef.current;
    if (!dom || !shouldRender) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let instance: any = null;
    let cancelled = false;
    let resizeHandler: (() => void) | null = null;

    import("echarts").then((echarts) => {
      if (cancelled || !dom || !dom.isConnected) return;

      instance = echarts.init(dom);

      const xKey = merged.x!;
      const yKey = Array.isArray(merged.y) ? merged.y[0] : merged.y!;
      const xData = merged.data.map((d) => String(d[xKey] ?? ""));
      const yData = merged.data.map((d) => Number(d[yKey]) || 0);

      /* Resolve color theme palette */
      const palette = COLOR_THEMES[merged.colorTheme ?? "indigo"] ?? COLOR_THEMES.indigo;
      const primaryColor = palette[0];
      const secondaryColor = palette[1];
      const darkColor = palette[3];

      /* Resolve legend position */
      const lp = merged.legendPosition ?? "bottom";
      const legendCfg = {
        orient: (lp === "left" || lp === "right" ? "vertical" : "horizontal") as "vertical" | "horizontal",
        ...(lp === "top" ? { top: 24, left: "center" } : {}),
        ...(lp === "bottom" ? { bottom: 4, left: "center" } : {}),
        ...(lp === "left" ? { left: 4, top: "middle" } : {}),
        ...(lp === "right" ? { right: 4, top: "middle" } : {}),
        textStyle: { color: "#94a3b8", fontSize: 10 },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let option: any;

      if (merged.type === "line") {
        option = {
          backgroundColor: "transparent",
          title: { text: merged.title, left: "center", top: 4, textStyle: { color: "#e2e8f0", fontSize: 14, fontWeight: "500" } },
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
            lineStyle: { color: primaryColor, width: 2 },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: primaryColor + "40" },
                { offset: 1, color: primaryColor + "05" },
              ]),
            },
            itemStyle: { color: primaryColor },
          }],
        };
      } else if (merged.type === "bar") {
        const needRotate = xData.some((s) => s.length > 6);
        option = {
          backgroundColor: "transparent",
          title: { text: merged.title, left: "center", top: 4, textStyle: { color: "#e2e8f0", fontSize: 14, fontWeight: "500" } },
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
                { offset: 0, color: secondaryColor },
                { offset: 1, color: darkColor },
              ]),
              borderRadius: [4, 4, 0, 0],
            },
          }],
        };
      } else if (merged.type === "pie") {
        const pieData = merged.data.map((d, i) => ({
          name: String(d[xKey] ?? ""),
          value: Number(d[yKey]) || 0,
          itemStyle: { color: palette[i % palette.length] },
        }));
        option = {
          backgroundColor: "transparent",
          title: { text: merged.title, left: "center", top: 4, textStyle: { color: "#e2e8f0", fontSize: 14, fontWeight: "500" } },
          tooltip: {
            trigger: "item",
            backgroundColor: "#1a2035",
            borderColor: "#2a3454",
            textStyle: { color: "#e2e8f0", fontSize: 12 },
            formatter: "{b}: {c} ({d}%)",
          },
          legend: legendCfg,
          series: [{
            type: "pie",
            radius: ["40%", "70%"],
            center: ["50%", "50%"],
            data: pieData,
            label: {
              show: true,
              color: "#94a3b8",
              fontSize: 10,
              formatter: "{b}\n{d}%",
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.5)",
              },
              scaleSize: 6,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec, overrides, shouldRender]);

  if (!shouldRender) return null;

  return (
    <div
      ref={domRef}
      className={className}
      style={{ width: "100%", height: "260px" }}
    />
  );
}
