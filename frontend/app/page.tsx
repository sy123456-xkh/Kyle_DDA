"use client"

import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"

const Silk = dynamic(() => import("./components/Silk"), { ssr: false })

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="h-screen overflow-hidden relative bg-[#0a0806]">
      {/* Silk animated background */}
      <div className="fixed inset-0" style={{ zIndex: 0 }}>
        <Silk speed={5} scale={1.2} color="#dc9450" noiseIntensity={0.6} rotation={5.1} />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Top nav bar */}
        <nav className="flex items-center justify-between px-8 py-5">
          <span className="text-sm font-bold tracking-widest text-amber-500/80 uppercase">
            Kyle Studios
          </span>
          <div className="flex items-center gap-6 text-xs tracking-widest text-white/40">
            <button
              onClick={() => router.push("/data-hub")}
              className="hover:text-amber-400 transition-colors"
            >
              DATA HUB
            </button>
            <button
              onClick={() => router.push("/copilot")}
              className="hover:text-amber-400 transition-colors"
            >
              COPILOT
            </button>
          </div>
        </nav>

        {/* Center content */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 -mt-8">
          <p className="text-[10px] text-amber-500/50 tracking-[0.4em] uppercase mb-5">
            Editorial Intelligence Platform
          </p>

          <h1 className="text-5xl md:text-7xl font-bold text-center leading-tight mb-4 landing-title">
            商业智能数据分析
          </h1>

          <p className="text-white/30 text-sm md:text-base max-w-lg text-center leading-relaxed mb-10">
            Upload CSV. Ask in natural language. Get instant insights.
            <br />
            The architect of your data&apos;s future.
          </p>

          <div className="flex gap-4">
            <button
              onClick={() => router.push("/data-hub")}
              className="group px-8 py-3 bg-amber-500/90 text-black rounded-full text-sm font-semibold hover:bg-amber-400 transition-all hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] flex items-center gap-2"
            >
              开始探索
              <svg
                className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            <button className="px-8 py-3 border border-white/15 text-white/50 rounded-full text-sm font-medium hover:border-amber-500/40 hover:text-amber-400/80 transition-all">
              View Demo
            </button>
          </div>

          {/* Mini dashboard preview — compact */}
          <div className="mt-12 w-full max-w-md">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-4 flex items-end gap-1.5 h-20">
              {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 65, 70, 55, 80, 60, 72, 48, 88, 62].map(
                (h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm transition-all"
                    style={{
                      height: `${h}%`,
                      background:
                        i % 4 === 0 ? "rgba(245, 158, 11, 0.7)" : "rgba(255, 255, 255, 0.08)",
                    }}
                  />
                )
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-8 py-4 flex justify-between items-center text-[10px] text-white/20 tracking-wider">
          <p>&copy; 2024 KYLE STUDIOS</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-amber-500/50 transition-colors">
              PRIVACY
            </a>
            <a href="#" className="hover:text-amber-500/50 transition-colors">
              TERMS
            </a>
            <a href="#" className="hover:text-amber-500/50 transition-colors">
              API
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}
