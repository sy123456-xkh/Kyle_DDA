"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"

const API = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  time: string
  actions?: { label: string; icon: string }[]
}

export default function CopilotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [querying, setQuerying] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Mock dataset state (in real app, from context/URL params)
  const [datasetId] = useState<string | null>(null)
  const mockFields = [
    "GMV",
    "ARPU",
    "Region",
    "Payment_Type",
    "User_ID",
    "Category",
    "Timestamp",
    "Store_ID",
  ]

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const now = () => new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })

  const handleSend = async () => {
    if (!input.trim() || querying) return
    const q = input
    setMessages((prev) => [...prev, { role: "user", content: q, time: now() }])
    setInput("")
    setQuerying(true)

    // PLACEHOLDER_REMAINING

    if (!datasetId) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "请先在 Data Hub 上传 CSV 数据集，然后返回 Copilot 进行分析。",
            time: now(),
          },
        ])
        setQuerying(false)
      }, 500)
      return
    }

    try {
      const res = await fetch(`${API}/chat/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataset_id: datasetId, question: q }),
      })
      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.ok
            ? `查询完成，返回 ${data.meta?.row_count ?? 0} 行，耗时 ${data.meta?.elapsed_ms ?? 0}ms。`
            : `查询失败: ${data.detail}`,
          time: now(),
          actions: res.ok
            ? [
                { label: "Export CSV", icon: "download" },
                { label: "Share Report", icon: "share" },
              ]
            : undefined,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "网络错误，请检查后端是否启动。", time: now() },
      ])
    } finally {
      setQuerying(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Top Nav */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-amber-700">
              Kyle Studios BI Copilot
            </Link>
            <div className="flex gap-6 text-sm">
              <span className="text-amber-600 border-b-2 border-amber-600 pb-1 font-medium">
                Workspace
              </span>
              <span className="text-gray-500">Insights</span>
              <span className="text-gray-500">Datasets</span>
              <span className="text-gray-500">Reports</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>
            <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
            <div className="w-8 h-8 rounded-full bg-amber-700 flex items-center justify-center text-white text-sm font-medium">
              K
            </div>
          </div>
        </div>
      </nav>

      {/* Three Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-64 border-r border-gray-200 flex flex-col bg-white">
          <div className="p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-1">当前数据集 (Current Dataset)</h2>
            <div className="flex items-center gap-1.5 mb-4">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs text-gray-500 uppercase tracking-wide">
                Project Alpha Active
              </span>
            </div>

            <div className="flex gap-3 mb-6">
              <div className="bg-gray-50 rounded-lg px-3 py-2 flex-1">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Rows</p>
                <p className="text-lg font-bold text-gray-900">200,000</p>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2 flex-1">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Columns</p>
                <p className="text-lg font-bold text-gray-900">15</p>
              </div>
            </div>

            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-3">
              Available Fields
            </p>
            <div className="flex flex-wrap gap-2">
              {mockFields.map((f, i) => (
                <span
                  key={f}
                  className={`text-xs px-3 py-1 rounded-full border ${i === 0 ? "border-amber-500 text-amber-600 bg-amber-50" : "border-gray-200 text-gray-600"}`}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-auto p-5 space-y-2">
            <button className="w-full py-2.5 rounded-lg bg-amber-50 text-amber-700 text-sm font-medium flex items-center justify-center gap-2 hover:bg-amber-100 transition-colors">
              <span className="text-lg">+</span> New Analysis
            </button>
            <div className="flex items-center gap-2 text-xs text-gray-400 px-1 pt-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
                <path strokeLinecap="round" strokeWidth={1.5} d="M12 16v-4M12 8h.01" />
              </svg>
              Help
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 px-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
              </svg>
              Feedback
            </div>
          </div>
        </aside>

        {/* Center: Chat */}
        <main className="flex-1 flex flex-col min-w-0 bg-gray-50">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center">
                  <svg
                    className="w-7 h-7 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <p className="text-sm">Ask anything about your data...</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <svg
                      className="w-4 h-4 text-amber-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-[70%] ${msg.role === "user" ? "bg-amber-50 border border-amber-200" : "bg-white border border-gray-200"} rounded-xl px-4 py-3`}
                >
                  <p className="text-sm text-gray-800">{msg.content}</p>
                  {msg.actions && (
                    <div className="flex gap-4 mt-3">
                      {msg.actions.map((a) => (
                        <button
                          key={a.label}
                          className="text-xs text-amber-600 font-medium flex items-center gap-1 hover:text-amber-700"
                        >
                          {a.icon === "download" ? "↓" : "↗"} {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 mt-2">{msg.time}</p>
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-amber-700 flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
            {querying && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-2">
                  <span
                    className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex gap-2 items-center">
              <input
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                placeholder="Ask anything about your data..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                disabled={querying}
              />
              <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
              </button>
              <button
                onClick={handleSend}
                disabled={!input.trim() || querying}
                className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 disabled:opacity-40 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19V5M5 12l7-7 7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </main>

        {/* Right Panel: Visualization + Insights */}
        <aside className="w-[400px] border-l border-gray-200 flex flex-col bg-white overflow-y-auto">
          {/* Chart Section */}
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                <h3 className="text-sm font-bold text-gray-900">数据可视化 (Data Visualization)</h3>
              </div>
              <div className="flex gap-1">
                <button className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  </svg>
                </button>
                <button className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="19" cy="12" r="1" />
                    <circle cx="5" cy="12" r="1" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Placeholder bar chart */}
            <div className="h-48 flex items-end gap-3 px-2 mb-4">
              {[
                { value: 72.4, label: "SP", color: "bg-amber-500" },
                { value: 51.2, label: "RJ", color: "bg-amber-400" },
                { value: 38.9, label: "MG", color: "bg-amber-300" },
                { value: 29.1, label: "BA", color: "bg-amber-200" },
                { value: 22.5, label: "PR", color: "bg-green-400" },
              ].map((bar) => (
                <div key={bar.label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-amber-600">{bar.value}k</span>
                  <div
                    className={`w-full ${bar.color} rounded-t`}
                    style={{ height: `${(bar.value / 72.4) * 140}px` }}
                  />
                  <span className="text-xs text-gray-500">{bar.label}</span>
                </div>
              ))}
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Growth</p>
                  <p className="text-lg font-bold text-gray-900">+12.4%</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Avg Ticket</p>
                  <p className="text-lg font-bold text-gray-900">$142.0</p>
                </div>
              </div>
            </div>
          </div>

          {/* Business Insights */}
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">💡</span>
              <h3 className="text-sm font-bold text-gray-900">专家建议 (Business Insights)</h3>
            </div>
            <div className="space-y-3">
              {[
                {
                  n: 1,
                  text: 'SP 地区 GMV 遥遥领先，建议加大该地区的运力投入，优化"最后一公里"配送效率。',
                },
                {
                  n: 2,
                  text: "RJ 与 MG 地区增长势头强劲，可考虑通过区域联动大促，进一步释放市场潜力。",
                },
                {
                  n: 3,
                  text: "BA 地区的客单价偏低，建议优化商品结构，引入更多高客单价品类（如电子产品或高端家居）。",
                },
              ].map((item) => (
                <div key={item.n} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {item.n}
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 py-2.5 border-2 border-dashed border-amber-300 rounded-xl text-sm text-amber-600 font-medium hover:bg-amber-50 transition-colors">
              + 生成深度分析报告
            </button>
          </div>

          {/* Active Model */}
          <div className="p-5">
            <div className="bg-gray-800 rounded-xl p-4 text-white">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Active Model</p>
              <p className="text-sm font-bold">Lumina LLM-v4 (Turbo)</p>
              <span className="inline-block mt-2 text-[10px] px-2 py-0.5 border border-gray-600 rounded text-gray-400 uppercase tracking-wide">
                Token Optimized
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
