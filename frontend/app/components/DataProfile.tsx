'use client'

interface ProfileData {
  row_count: number
  columns: Array<{ name: string; type: string }>
  missing_rate: Array<{ name: string; missing_rate: number }>
}

interface DataProfileProps {
  data: ProfileData | null
}

export default function DataProfile({ data }: DataProfileProps) {
  if (!data) return null

  const completeness = data.missing_rate.length > 0
    ? Math.round((1 - data.missing_rate.reduce((sum, m) => sum + m.missing_rate, 0) / data.missing_rate.length) * 100)
    : 100

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Data Profile</h2>
        <span className="text-xs text-gray-500 uppercase tracking-wide">ACTIVE ANALYSIS</span>
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">DATASET SIZE</span>
          </div>
          <div className="text-4xl font-bold mb-1">{data.row_count.toLocaleString()}</div>
          <div className="text-sm text-gray-600">总行数 (Row Count)</div>
        </div>

        <div className="bg-white p-6 rounded-xl border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">SCHEMA WIDTH</span>
          </div>
          <div className="text-4xl font-bold mb-1">{data.columns.length}</div>
          <div className="text-sm text-gray-600">字段数量 (Column Count)</div>
        </div>

        <div className="bg-white p-6 rounded-xl border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">QUALITY SCORE</span>
          </div>
          <div className="text-4xl font-bold mb-1">{completeness}%</div>
          <div className="text-sm text-gray-600">数据完整度 (Data Completeness)</div>
        </div>
      </div>
    </div>
  )
}
