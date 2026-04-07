"use client"

import Navigation from "../components/Navigation"
import UploadZone from "../components/UploadZone"
import DataProfile from "../components/DataProfile"
import ErrorBoundary from "../components/ErrorBoundary"
import { SkeletonCard } from "../components/Skeleton"
import { useToast } from "../components/Toast"
import { useData } from "../contexts/DataContext"
import { api } from "@/lib/api"

function DataHubContent() {
  const { datasetId, profile, isLoading, setDataset, setLoading } = useData()
  const { show } = useToast()

  const handleUpload = async (file: File) => {
    setLoading(true)

    try {
      const { dataset_id } = await api.uploadDataset(file)
      const profileData = await api.getProfile(dataset_id)
      setDataset(dataset_id, profileData)
      show(`数据集 ${dataset_id} 导入成功`, "success")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed"
      show(msg, "error")
      throw err // re-throw so UploadZone can detect failure
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation activePage="data-hub" hasDataset={!!datasetId} />
      <main className="max-w-screen-xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Data Hub</h1>
          <p className="text-gray-500">Central intelligence for your raw datasets.</p>
        </div>

        <ErrorBoundary>
          <UploadZone onUpload={handleUpload} onSizeError={(msg) => show(msg, "error")} />

          {isLoading ? (
            <div className="mt-8">
              <SkeletonCard />
            </div>
          ) : (
            <DataProfile data={profile} />
          )}
        </ErrorBoundary>
      </main>
    </div>
  )
}

export default function DataHubPage() {
  return <DataHubContent />
}
