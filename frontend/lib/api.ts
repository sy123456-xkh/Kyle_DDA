import { DataProfile, ApiError } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

class ApiClient {
  async uploadDataset(file: File): Promise<{ dataset_id: string }> {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API_BASE_URL}/datasets/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const error: ApiError = await res.json()
        throw new Error(error.detail || 'Upload failed')
      }

      return await res.json()
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Upload failed')
    }
  }

  async getProfile(datasetId: string): Promise<DataProfile> {
    try {
      const res = await fetch(`${API_BASE_URL}/datasets/${datasetId}/profile`)

      if (!res.ok) {
        const error: ApiError = await res.json()
        throw new Error(error.detail || 'Failed to fetch profile')
      }

      return await res.json()
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch profile')
    }
  }
}

export const api = new ApiClient()
