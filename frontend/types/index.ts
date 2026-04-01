export interface Column {
  name: string
  type: string
}

export interface MissingRate {
  name: string
  missing_rate: number
}

export interface SampleValues {
  name: string
  values: any[]
}

export interface DataProfile {
  row_count: number
  columns: Column[]
  missing_rate: MissingRate[]
  sample_values: SampleValues[]
}

export interface ApiError {
  detail: string
  status?: number
}

export type ApiResponse<T> = T
