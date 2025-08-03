export interface RefDataResponse {
  regions?: string[]
  prices?: Array<{
    duration: number
    price: number
  }>
  [key: string]: unknown
}

export interface ApiError {
  message: string
  status: number
  code?: string
  details?: unknown
}

export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

export interface QueryOptions {
  enabled?: boolean
  refetchInterval?: number
  staleTime?: number
} 