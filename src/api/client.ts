import { QueryClient } from '@tanstack/react-query'
import type { ClientAvailableRequest, ClientAvailableResponse, ClientInfo, ClientListRequest, ClientProfileRequest } from './types'

export const API_BASE_URL = 'https://api.b7s.services/api'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
})

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  try {
    const { headers, ...restOptions } = options
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
        ...headers,
      },
      ...restOptions,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`)
    }

    // Handle empty responses explicitly
    if (response.status === 204 || response.status === 205) {
      return {} as T
    }

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      return response.json() as Promise<T>
    }

    // Fallback: try to parse text as JSON, else return empty object
    const text = await response.text()
    try {
      return JSON.parse(text) as T
    } catch {
      return {} as T
    }
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Network error: Unable to connect to the API')
    }
    throw error
  }
}

export function get<T>(endpoint: string, options?: RequestInit): Promise<T> {
  return apiClient<T>(endpoint, { method: 'GET', ...options })
}

export function post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
  return apiClient<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  })
} 

// Types moved to types.ts to avoid conflicts

export function getClientList(request: ClientListRequest): Promise<ClientInfo[]> {
  return post<ClientInfo[]>('/client/list', request)
} 

// Types moved to types.ts to avoid conflicts

export function checkClientAvailable(request: ClientAvailableRequest): Promise<ClientAvailableResponse> {
  return post<ClientAvailableResponse>('/client/available', request)
}

export function getClientProfile(request: ClientProfileRequest): Promise<string> {
  const url = `${API_BASE_URL}/client/profile`
  
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
    },
    body: JSON.stringify(request),
    redirect: 'manual'
  }).then(async (response) => {
    console.log('Profile response status:', response)
    
    // Handle successful redirect
    if (response.status === 302) {
      const location = response.headers.get('location')
      if (location) {
        return location
      }
      throw new Error('No redirect location found')
    }
    
    if (response.type === 'opaqueredirect') {
      console.log('Got opaque redirect, using follow approach...')
      return fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify(request),
        redirect: 'follow'
      }).then(finalResponse => {
        console.log('Final response URL:', finalResponse.url)
        if (finalResponse.url && finalResponse.url !== url) {
          return finalResponse.url
        }
        throw new Error('Could not get redirect URL')
      })
    }
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`)
    }
    
    return response.text()
  })
} 