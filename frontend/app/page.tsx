"use client";

import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="landing-wrapper">
      {/* 背景装饰 */}
      <div className="landing-grid" />
      <div className="landing-glow landing-glow-1" />
      <div className="landing-glow landing-glow-2" />

      {/* 浮动几何装饰 */}
      <div className="landing-shape landing-shape-1" />
      <div className="landing-shape landing-shape-2" />
      <div className="landing-shape landing-shape-3" />

      {/* 主内容 */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 animate-fade-in">
        {/* Logo */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-8 shadow-lg shadow-indigo-500/30">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <path d="M8 9h8" />
            <path d="M8 13h4" />
          </svg>
        </div>

        {/* 标题 */}
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            InsightFlow
          </span>
        </h1>
        <p className="text-xl text-[var(--text-secondary)] mb-2 font-medium">
          智能数据分析平台
        </p>
        <p className="text-sm text-[var(--text-muted)] mb-12 max-w-md leading-relaxed">
          上传 CSV · 自然语言提问 · 即时洞察
        </p>

        {/* 特性卡片 */}
        <div className="flex gap-6 mb-12">
          {[
            { icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", label: "CSV 导入", desc: "拖拽上传，自动解析" },
            { icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z", label: "智能问答", desc: "自然语言查询数据" },
            { icon: "M18 20V10M12 20V4M6 20v-6", label: "可视分析", desc: "趋势图表洞察" },
          ].map((f, i) => (
            <div
              key={f.label}
              className="glass-card p-5 w-44 animate-slide-up"
              style={{ animationDelay: `${200 + i * 100}ms` }}
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center mb-3 mx-auto border border-[var(--border)]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={f.icon} />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{f.label}</h3>
              <p className="text-xs text-[var(--text-muted)]">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* 开始体验按钮 */}
        <button
          className="btn-primary text-lg px-10 py-3.5 rounded-xl animate-slide-up"
          style={{ animationDelay: "500ms" }}
          onClick={() => router.push("/workspace")}
        >
          开始体验
          <svg className="inline-block ml-2 -mr-1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>

        {/* 底部品牌 */}
        <p className="mt-16 text-xs text-[var(--text-muted)] tracking-wider animate-fade-in" style={{ animationDelay: "700ms" }}>
          by <span className="text-[var(--text-secondary)] font-medium">KyleStudios</span>
        </p>
      </div>
    </div>
  );
}
