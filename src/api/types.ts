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

export interface TxSignupRequest {
  clientAddress: string
  duration: number
  price: number
  region: string
}

export interface TxSignupResponse {
  clientId: string
  txCbor: string
}

export interface ClientListRequest {
  clientAddress: string
}

export interface ClientInfo {
  expiration: string
  id: string
  region: string
}

export interface ClientListResponse extends ApiResponse<ClientInfo[]> {
  data: ClientInfo[]
} 