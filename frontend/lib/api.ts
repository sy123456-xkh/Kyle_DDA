import { DataProfile, ApiError } from "@/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"

// AI Insight types
interface AIInsightRequest {
  dataset_id: string
  question: string
  chart?: Record<string, unknown> | null
  rows: Record<string, unknown>[]
  manifest: Record<string, unknown>
}

interface ABTestSpec {
  goal: string
  metric: string
  design: string
  duration: string
}

export interface AIInsightResponse {
  insight: string
  suggestions: string[]
  ab_test: ABTestSpec | null
}

class ApiClient {
  async uploadDataset(file: File): Promise<{ dataset_id: string }> {
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch(`${API_BASE_URL}/datasets/upload`, {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const error: ApiError = await res.json()
        throw new Error(error.detail || "Upload failed")
      }

      return await res.json()
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Upload failed")
    }
  }

  async getProfile(datasetId: string): Promise<DataProfile> {
    try {
      const res = await fetch(`${API_BASE_URL}/datasets/${datasetId}/profile`)

      if (!res.ok) {
        const error: ApiError = await res.json()
        throw new Error(error.detail || "Failed to fetch profile")
      }

      return await res.json()
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to fetch profile")
    }
  }

  async aiInsight(req: AIInsightRequest): Promise<AIInsightResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/ai/insight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      })

      if (!res.ok) {
        const error: { detail?: string } = await res.json()
        throw new Error(error.detail || "AI insight failed")
      }

      return await res.json()
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "AI insight failed")
    }
  }
}

export const api = new ApiClient()
