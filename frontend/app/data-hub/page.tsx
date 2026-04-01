'use client'

import { useState } from 'react'
import Navigation from '../components/Navigation'
import UploadZone from '../components/UploadZone'
import DataProfile from '../components/DataProfile'

export default function DataHubPage() {
  const [datasetId, setDatasetId] = useState<string | null>(null)
  const [profileData, setProfileData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleUpload = async (file: File) => {
    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('http://localhost:8000/datasets/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      setDatasetId(data.dataset_id)

      // 获取 profile
      const profileRes = await fetch(`http://localhost:8000/datasets/${data.dataset_id}/profile`)
      const profile = await profileRes.json()
      setProfileData(profile)
    } catch (error) {
      console.error('Upload failed:', error)
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

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Processing...</p>
          </div>
        ) : (
          <>
            <UploadZone onUpload={handleUpload} />
            <DataProfile data={profileData} />
          </>
        )}
      </main>
    </div>
  )
}
