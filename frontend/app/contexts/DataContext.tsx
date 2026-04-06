"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { DataProfile } from "@/types"

interface DataContextType {
  datasetId: string | null
  profile: DataProfile | null
  isLoading: boolean
  error: string | null
  setDataset: (id: string, profile: DataProfile) => void
  clearDataset: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [datasetId, setDatasetId] = useState<string | null>(null)
  const [profile, setProfile] = useState<DataProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setDataset = (id: string, profileData: DataProfile) => {
    setDatasetId(id)
    setProfile(profileData)
    setError(null)
  }

  const clearDataset = () => {
    setDatasetId(null)
    setProfile(null)
    setError(null)
  }

  const setLoading = (loading: boolean) => {
    setIsLoading(loading)
  }

  return (
    <DataContext.Provider
      value={{
        datasetId,
        profile,
        isLoading,
        error,
        setDataset,
        clearDataset,
        setLoading,
        setError,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}
