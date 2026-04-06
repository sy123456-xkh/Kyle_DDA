import type { Metadata } from "next"
import "./globals.css"
import { ToastProvider } from "./components/Toast"

export const metadata: Metadata = {
  title: "Kyle Studios — 商业智能数据分析",
  description: "上传 CSV · 自然语言提问 · 即时洞察 | by Kyle Studios",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
