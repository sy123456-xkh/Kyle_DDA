'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

interface UploadZoneProps {
  onUpload: (file: File) => Promise<void> | void
  onSizeError?: (msg: string) => void
}

export default function UploadZone({ onUpload, onSizeError }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Cleanup progress timer on unmount
  useEffect(() => {
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current)
    }
  }, [])

  const startProgress = useCallback(() => {
    setProgress(0)
    if (progressTimer.current) clearInterval(progressTimer.current)
    progressTimer.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          if (progressTimer.current) clearInterval(progressTimer.current)
          return 90
        }
        return prev + Math.random() * 12
      })
    }, 200)
  }, [])

  const finishProgress = useCallback((ok: boolean) => {
    if (progressTimer.current) clearInterval(progressTimer.current)
    setProgress(100)
    setStatus(ok ? 'success' : 'error')
    // Reset to idle after brief delay
    setTimeout(() => {
      setStatus('idle')
      setProgress(0)
    }, 1500)
  }, [])

  const processFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) return

    if (file.size > MAX_FILE_SIZE) {
      const msg = `文件过大 (${(file.size / 1024 / 1024).toFixed(1)}MB)，最大支持 50MB`
      onSizeError?.(msg)
      return
    }

    setStatus('uploading')
    startProgress()

    try {
      await onUpload(file)
      finishProgress(true)
    } catch {
      finishProgress(false)
    }
  }, [onUpload, onSizeError, startProgress, finishProgress])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const isDisabled = status === 'uploading'

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-16 text-center transition-colors ${
        isDisabled ? 'opacity-60 pointer-events-none' : ''
      } ${
        isDragging ? 'border-amber-500 bg-amber-50' : 'border-gray-300'
      }`}
      onDragOver={(e) => { e.preventDefault(); if (!isDisabled) setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
          {isDragging ? (
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          )}
        </div>
        <div>
          {isDragging ? (
            <>
              <h3 className="text-2xl font-bold text-amber-600 mb-2">松开以上传</h3>
              <p className="text-amber-500">Release to upload</p>
            </>
          ) : status === 'uploading' ? (
            <>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">上传中...</h3>
              <p className="text-gray-500">Uploading...</p>
            </>
          ) : status === 'success' ? (
            <>
              <h3 className="text-2xl font-bold text-emerald-600 mb-2">上传成功</h3>
              <p className="text-emerald-500">Upload complete</p>
            </>
          ) : status === 'error' ? (
            <>
              <h3 className="text-2xl font-bold text-red-600 mb-2">上传失败</h3>
              <p className="text-red-500">Upload failed</p>
            </>
          ) : (
            <>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">上传 CSV 数据文件</h3>
              <p className="text-gray-500">Upload CSV data file</p>
            </>
          )}
        </div>

        {/* Progress bar */}
        {status === 'uploading' && (
          <div className="w-full max-w-xs h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}

        <label className={`px-8 py-3 rounded-full font-medium transition-colors ${
          isDisabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-amber-500 text-white cursor-pointer hover:bg-amber-600'
        }`}>
          {isDisabled ? 'Uploading...' : 'Browse Local Files'}
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileSelect} disabled={isDisabled} />
        </label>
        <p className="text-xs text-gray-500 mt-2">MAX FILE SIZE 50MB &middot; UTF-8 RECOMMENDED</p>
      </div>
    </div>
  )
}
