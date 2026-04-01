'use client'

import { useState } from 'react'

interface UploadZoneProps {
  onUpload: (file: File) => void
}

export default function UploadZone({ onUpload }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.csv')) {
      onUpload(file)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onUpload(file)
    }
  }

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-16 text-center ${
        isDragging ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <h3 className="text-2xl font-bold mb-2">上传 CSV 数据文件</h3>
          <p className="text-gray-600">Upload CSV data file</p>
        </div>
        <label className="px-8 py-3 bg-orange-500 text-white rounded-full font-medium cursor-pointer hover:bg-orange-600">
          Browse Local Files
          <input type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
        </label>
        <p className="text-xs text-gray-500 mt-2">MAX FILE SIZE 256MB • UTF-8 RECOMMENDED</p>
      </div>
    </div>
  )
}
