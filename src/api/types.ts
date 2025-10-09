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
  paymentAddress: string
  duration: number
  price: number
  region: string
}

export interface TxSignupResponse {
  clientId: string
  txCbor: string
}

export interface ClientListRequest {
  ownerAddress: string
}

export interface ClientInfo {
  expiration: string
  id: string
  region: string
}

export interface ClientListResponse extends ApiResponse<ClientInfo[]> {
  data: ClientInfo[]
}

export interface ClientAvailableRequest {
  id: string
}

export interface ClientAvailableResponse {
  msg?: string
}

export interface ClientProfileRequest {
  id: string
  key: string
  signature: string
}

export interface TxRenewRequest {
  paymentAddress: string
  clientId: string
  duration: number
  price: number
  region: string
}

export interface TxRenewResponse {
  txCbor: string
}
