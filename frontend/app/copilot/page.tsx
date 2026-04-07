"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useData } from "../contexts/DataContext"
import { api, AIInsightResponse } from "@/lib/api"
import { useToast } from "../components/Toast"

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
  const [insights, setInsights] = useState<string[]>([])
  const [lastRows, setLastRows] = useState<Record<string, unknown>[]>([])
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportData, setReportData] = useState<AIInsightResponse | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const { datasetId, profile } = useData()
  const { show } = useToast()
  const fields = profile?.columns.map((c) => c.name) ?? []

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
      // Step 1: call /chat/query for actual data rows
      let rows: Record<string, unknown>[] = []
      try {
        const chatRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"}/chat/query`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dataset_id: datasetId, question: q }),
          }
        )
        if (chatRes.ok) {
          const chatData = await chatRes.json()
          rows = chatData.rows ?? []
          setLastRows(rows)
        }
      } catch {
        // chat/query failure does not block AI reply
      }

      // Step 2: call /ai/insight with rows
      const aiRes = await api.aiInsight({
        dataset_id: datasetId,
        question: q,
        rows: rows.slice(0, 20),
        manifest: {},
      })

      // Step 3: format AI reply
      const lines: string[] = []
      if (aiRes.insight) lines.push(aiRes.insight)
      if (aiRes.suggestions?.length) {
        lines.push("")
        lines.push("建议：")
        aiRes.suggestions.forEach((s, i) => lines.push(`${i + 1}. ${s}`))
      }
      if (aiRes.ab_test) {
        lines.push("")
        lines.push(`A/B 测试方案：${aiRes.ab_test.goal}`)
        lines.push(`指标：${aiRes.ab_test.metric} | 周期：${aiRes.ab_test.duration}`)
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: lines.join("\n"),
          time: now(),
          actions: [
            { label: "Export CSV", icon: "download" },
            { label: "Share Report", icon: "share" },
          ],
        },
      ])

      // Step 4: update right panel Business Insights (replace, not accumulate)
      if (aiRes.suggestions?.length) {
        setInsights(aiRes.suggestions)
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: err instanceof Error ? err.message : "查询失败，请检查后端是否启动。",
          time: now(),
        },
      ])
    } finally {
      setQuerying(false)
    }
  }

  const exportCSV = () => {
    if (!lastRows.length) {
      show("暂无数据可导出，请先发送查询", "error")
      return
    }
    const headers = Object.keys(lastRows[0]).join(",")
    const body = lastRows
      .map((r) =>
        Object.values(r)
          .map((v) => {
            const s = String(v ?? "")
            return s.includes(",") || s.includes("\n") || s.includes('"')
              ? `"${s.replace(/"/g, '""')}"`
              : s
          })
          .join(",")
      )
      .join("\n")
    const blob = new Blob([headers + "\n" + body], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `export_${datasetId ?? "data"}_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    show("CSV 已下载", "success")
  }

  const shareReport = async () => {
    await navigator.clipboard.writeText(window.location.href)
    show("链接已复制到剪贴板", "success")
  }

  const newAnalysis = () => {
    setMessages([])
    setInsights([])
    setLastRows([])
  }

  const generateReport = async () => {
    if (!datasetId) {
      show("请先上传数据集", "error")
      return
    }
    try {
      const res = await api.aiInsight({
        dataset_id: datasetId,
        question: "生成完整数据分析报告",
        rows: lastRows.slice(0, 20),
        manifest: {},
      })
      setReportData(res)
      setShowReportModal(true)
    } catch (err) {
      show(err instanceof Error ? err.message : "报告生成失败", "error")
    }
  }

  return (
    <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 65px)" }}>
      {/* Left Sidebar */}
      <aside className="w-64 border-r border-gray-200 flex flex-col bg-white">
        <div className="p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-1">当前数据集 (Current Dataset)</h2>
          <div className="flex items-center gap-1.5 mb-4">
            <span className={`w-2 h-2 rounded-full ${datasetId ? "bg-green-500" : "bg-gray-300"}`} />
            <span className="text-xs text-gray-500 uppercase tracking-wide">
              {datasetId ? datasetId : "未上传"}
            </span>
          </div>

          <div className="flex gap-3 mb-6">
            <div className="bg-gray-50 rounded-lg px-3 py-2 flex-1">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Rows</p>
              <p className="text-lg font-bold text-gray-900">
                {profile ? profile.row_count.toLocaleString() : "—"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2 flex-1">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Columns</p>
              <p className="text-lg font-bold text-gray-900">
                {profile ? profile.columns.length : "—"}
              </p>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-3">
            Available Fields
          </p>
          {datasetId ? (
            <div className="flex flex-wrap gap-2">
              {fields.map((f, i) => (
                <span
                  key={f}
                  className={`text-xs px-3 py-1 rounded-full border ${i === 0 ? "border-amber-500 text-amber-600 bg-amber-50" : "border-gray-200 text-gray-600"}`}
                >
                  {f}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">
              请先前往{" "}
              <Link href="/data-hub" className="text-amber-600 underline">
                Data Hub
              </Link>{" "}
              上传数据集
            </p>
          )}
        </div>

        <div className="mt-auto p-5 space-y-2">
          <button
            onClick={newAnalysis}
            className="w-full py-2.5 rounded-lg bg-amber-50 text-amber-700 text-sm font-medium flex items-center justify-center gap-2 hover:bg-amber-100 transition-colors"
          >
            <span className="text-lg">+</span> New Analysis
          </button>
          <button
            onClick={() => show("功能建设中，敬请期待", "info")}
            className="flex items-center gap-2 text-xs text-gray-400 px-1 pt-2 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
              <path strokeLinecap="round" strokeWidth={1.5} d="M12 16v-4M12 8h.01" />
            </svg>
            Help
          </button>
          <button
            onClick={() => show("功能建设中，敬请期待", "info")}
            className="flex items-center gap-2 text-xs text-gray-400 px-1 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
            </svg>
            Feedback
          </button>
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
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</p>
                {msg.actions && (
                  <div className="flex gap-4 mt-3">
                    {msg.actions.map((a) => (
                      <button
                        key={a.label}
                        onClick={a.icon === "download" ? exportCSV : shareReport}
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
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
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
              <button
                onClick={() => show("全屏功能建设中", "info")}
                className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
              </button>
              <button
                onClick={() => show("更多功能建设中", "info")}
                className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100"
              >
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
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
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
            {insights.length > 0 ? (
              insights.map((text, i) => (
                <div key={i} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400">发送问题后，AI 洞察将显示在此处</p>
            )}
          </div>

          <button
            onClick={generateReport}
            className="w-full mt-4 py-2.5 border-2 border-dashed border-amber-300 rounded-xl text-sm text-amber-600 font-medium hover:bg-amber-50 transition-colors"
          >
            + 生成深度分析报告
          </button>
        </div>

        {/* Active Model */}
        <div className="p-5">
          <div className="bg-gray-800 rounded-xl p-4 text-white">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Active Model</p>
            <p className="text-sm font-bold">{process.env.NEXT_PUBLIC_LLM_MODEL || "AI Copilot"}</p>
            <span className="inline-block mt-2 text-[10px] px-2 py-0.5 border border-gray-600 rounded text-gray-400 uppercase tracking-wide">
              OpenAI Compatible
            </span>
          </div>
        </div>
      </aside>

      {/* Report Modal */}
      {showReportModal && reportData && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowReportModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">深度分析报告</h2>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">核心结论</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{reportData.insight}</p>
              </div>
              {reportData.suggestions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">可执行建议</h3>
                  <ul className="space-y-2">
                    {reportData.suggestions.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-600">
                        <span className="text-amber-500 font-bold">{i + 1}.</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {reportData.ab_test && (
                <div className="bg-amber-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-amber-700 mb-2">A/B 测试方案</h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p><span className="font-medium">目标：</span>{reportData.ab_test.goal}</p>
                    <p><span className="font-medium">指标：</span>{reportData.ab_test.metric}</p>
                    <p><span className="font-medium">分组：</span>{reportData.ab_test.design}</p>
                    <p><span className="font-medium">周期：</span>{reportData.ab_test.duration}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
