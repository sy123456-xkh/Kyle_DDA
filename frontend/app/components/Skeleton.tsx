'use client'

interface SkeletonLineProps {
  width?: string
  height?: string
}

export function SkeletonLine({ width = '100%', height = '16px' }: SkeletonLineProps) {
  return (
    <div
      className="animate-pulse bg-gray-200 rounded"
      style={{ width, height }}
      role="status"
      aria-label="加载中"
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="grid grid-cols-3 gap-6" role="status" aria-label="加载中">
      {[0, 1, 2].map(i => (
        <div key={i} className="bg-white p-6 rounded-xl border animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg" />
            <div className="h-3 w-24 bg-gray-200 rounded" />
          </div>
          <div className="h-8 w-20 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonTable() {
  return (
    <div className="space-y-3" role="status" aria-label="加载中">
      {/* Header row */}
      <div className="flex gap-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
        ))}
      </div>
      {/* Data rows */}
      {[0, 1, 2, 3, 4].map(row => (
        <div key={row} className="flex gap-4">
          {[0, 1, 2, 3].map(col => (
            <div key={col} className="h-3 bg-gray-100 rounded animate-pulse flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}
