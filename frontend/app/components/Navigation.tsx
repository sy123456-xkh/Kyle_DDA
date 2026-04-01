'use client'

import Link from 'next/link'

export default function Navigation() {
  return (
    <nav className="border-b bg-white">
      <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold">Kyle Studios</Link>
          <div className="flex gap-6 text-sm">
            <Link href="/" className="text-gray-600 hover:text-gray-900">Landing</Link>
            <Link href="/data-hub" className="text-orange-500 border-b-2 border-orange-500 pb-1">Data Hub</Link>
            <Link href="/copilot" className="text-gray-600 hover:text-gray-900">Copilot</Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
          </button>
          <button className="px-6 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
            Get Started
          </button>
        </div>
      </div>
    </nav>
  )
}
