'use client'

import Navigation from '../components/Navigation'
import UploadZone from '../components/UploadZone'
import DataProfile from '../components/DataProfile'
import { DataProvider, useData } from '../contexts/DataContext'
import { api } from '@/lib/api'

function DataHubContent() {
  const { profile, isLoading, error, setDataset, setLoading, setError } = useData()

  const handleUpload = async (file: File) => {
    setLoading(true)
    setError(null)

    try {
      const { dataset_id } = await api.uploadDataset(file)
      const profileData = await api.getProfile(dataset_id)
      setDataset(dataset_id, profileData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-screen-xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Data Hub</h1>
          <p className="text-gray-600">Central intelligence for your raw datasets.</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Processing...</p>
          </div>
        ) : (
          <>
            <UploadZone onUpload={handleUpload} />
            <DataProfile data={profile} />
          </>
        )}
      </main>
    </div>
  )
}

export default function DataHubPage() {
  return (
    <DataProvider>
      <DataHubContent />
    </DataProvider>
  )
}
