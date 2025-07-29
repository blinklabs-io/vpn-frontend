import { QueryClient } from '@tanstack/react-query'

export const API_BASE_URL = import.meta.env.DEV 
  ? '/api'
  : 'https://api.b7s.services/api'

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

    return response.json()
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