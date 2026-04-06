"use client"

import Link from "next/link"

interface NavigationProps {
  activePage?: "landing" | "data-hub" | "copilot"
  hasDataset?: boolean
}

export default function Navigation({
  activePage = "landing",
  hasDataset = false,
}: NavigationProps) {
  const linkClass = (page: string) =>
    page === activePage
      ? "text-amber-600 border-b-2 border-amber-600 pb-1 font-medium"
      : "text-gray-600 hover:text-gray-900 font-medium"

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Kyle Studios
          </Link>
          <div className="flex gap-6 text-sm">
            <Link href="/" className={linkClass("landing")}>
              Landing
            </Link>
            <Link href="/data-hub" className={linkClass("data-hub")}>
              Data Hub
            </Link>
            <Link href="/copilot" className={linkClass("copilot")}>
              Copilot
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
          </button>
          <Link
            href={hasDataset ? "/copilot" : "#"}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              hasDataset
                ? "bg-amber-500 text-white hover:bg-amber-600"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            onClick={(e) => !hasDataset && e.preventDefault()}
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  )
}
